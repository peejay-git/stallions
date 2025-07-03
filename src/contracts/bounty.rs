#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, Symbol, Vec, String, Map,
    IntoVal, TryFromVal, FromVal, RawVal, BytesN,
};

// Bounty status enum
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BountyStatus {
    Open,
    InProgress,
    Review,
    Completed,
    Cancelled,
}

// Submission status enum
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum SubmissionStatus {
    Pending,
    Accepted,
    Rejected,
}

// Bounty structure
#[contracttype]
#[derive(Clone, Debug)]
pub struct Bounty {
    // Unique identifier for the bounty
    pub id: BytesN<32>,
    // Title of the bounty
    pub title: String,
    // Description of the bounty
    pub description: String,
    // Reward amount (in stroops)
    pub reward_amount: i128,
    // Reward asset (token contract address)
    pub reward_asset: Address,
    // Owner of the bounty
    pub owner: Address,
    // Deadline timestamp
    pub deadline: u64,
    // Current status
    pub status: BountyStatus,
    // Category (as a string)
    pub category: String,
    // Required skills
    pub skills: Vec<String>,
    // Creation timestamp
    pub created: u64,
    // Last updated timestamp
    pub updated: u64,
}

// Submission structure
#[contracttype]
#[derive(Clone, Debug)]
pub struct Submission {
    // Unique identifier for the submission
    pub id: BytesN<32>,
    // ID of the bounty this submission is for
    pub bounty_id: BytesN<32>,
    // Address of the submitter
    pub applicant: Address,
    // Content or link to the submission
    pub content: String,
    // Creation timestamp
    pub created: u64,
    // Status of the submission
    pub status: SubmissionStatus,
}

// Contract state storage keys
#[contracttype]
#[derive(Clone)]
enum DataKey {
    // Map of bounty ID to Bounty
    Bounty(BytesN<32>),
    // List of all bounty IDs
    BountyList,
    // Map of submission ID to Submission
    Submission(BytesN<32>),
    // List of all submission IDs for a bounty
    SubmissionList(BytesN<32>),
}

#[contract]
pub struct BountyContract;

#[contractimpl]
impl BountyContract {
    // Create a new bounty
    pub fn create_bounty(
        env: Env,
        title: String,
        description: String,
        reward_amount: i128,
        reward_asset: Address,
        deadline: u64,
        category: String,
        skills: Vec<String>,
    ) -> BytesN<32> {
        // Check if title is not empty
        if title.is_empty() {
            panic!("Title cannot be empty");
        }

        // Check reward amount is positive
        if reward_amount <= 0 {
            panic!("Reward amount must be positive");
        }

        // Check deadline is in the future
        let now = env.ledger().timestamp();
        if deadline <= now {
            panic!("Deadline must be in the future");
        }

        // Get the caller as the owner
        let owner = env.invoker();

        // Generate a unique ID for the bounty
        let id = env.crypto().sha256(&env.crypto().random());

        // Create the bounty
        let bounty = Bounty {
            id: id.clone(),
            title,
            description,
            reward_amount,
            reward_asset,
            owner,
            deadline,
            status: BountyStatus::Open,
            category,
            skills,
            created: now,
            updated: now,
        };

        // Store the bounty in contract storage
        env.storage().instance().set(&DataKey::Bounty(id.clone()), &bounty);

        // Get the current list of bounties and append the new one
        let mut bounty_list: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::BountyList)
            .unwrap_or_else(|| Vec::new(&env));
        bounty_list.push_back(id.clone());
        env.storage().instance().set(&DataKey::BountyList, &bounty_list);

        // Return the bounty ID
        id
    }

    // Get a bounty by ID
    pub fn get_bounty(env: Env, id: BytesN<32>) -> Bounty {
        env.storage()
            .instance()
            .get(&DataKey::Bounty(id))
            .unwrap_or_else(|| panic!("Bounty not found"))
    }

    // Get all bounties
    pub fn list_bounties(env: Env) -> Vec<Bounty> {
        let bounty_list: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::BountyList)
            .unwrap_or_else(|| Vec::new(&env));

        let mut bounties = Vec::new(&env);
        for id in bounty_list.iter() {
            let bounty: Bounty = env
                .storage()
                .instance()
                .get(&DataKey::Bounty(id))
                .unwrap();
            bounties.push_back(bounty);
        }
        bounties
    }

    // Update a bounty (only owner can update)
    pub fn update_bounty(
        env: Env,
        id: BytesN<32>,
        title: Option<String>,
        description: Option<String>,
        reward_amount: Option<i128>,
        reward_asset: Option<Address>,
        deadline: Option<u64>,
        status: Option<BountyStatus>,
        category: Option<String>,
        skills: Option<Vec<String>>,
    ) -> Bounty {
        // Get the existing bounty
        let mut bounty: Bounty = env
            .storage()
            .instance()
            .get(&DataKey::Bounty(id.clone()))
            .unwrap_or_else(|| panic!("Bounty not found"));

        // Check if caller is the owner
        let caller = env.invoker();
        if caller != bounty.owner {
            panic!("Only the owner can update the bounty");
        }

        // Update fields if provided
        if let Some(title_val) = title {
            if !title_val.is_empty() {
                bounty.title = title_val;
            } else {
                panic!("Title cannot be empty");
            }
        }

        if let Some(description_val) = description {
            bounty.description = description_val;
        }

        if let Some(reward_amount_val) = reward_amount {
            if reward_amount_val > 0 {
                bounty.reward_amount = reward_amount_val;
            } else {
                panic!("Reward amount must be positive");
            }
        }

        if let Some(reward_asset_val) = reward_asset {
            bounty.reward_asset = reward_asset_val;
        }

        if let Some(deadline_val) = deadline {
            if deadline_val > env.ledger().timestamp() {
                bounty.deadline = deadline_val;
            } else {
                panic!("Deadline must be in the future");
            }
        }

        if let Some(status_val) = status {
            bounty.status = status_val;
        }

        if let Some(category_val) = category {
            bounty.category = category_val;
        }

        if let Some(skills_val) = skills {
            bounty.skills = skills_val;
        }

        // Update the timestamp
        bounty.updated = env.ledger().timestamp();

        // Store the updated bounty
        env.storage().instance().set(&DataKey::Bounty(id), &bounty);

        bounty
    }

    // Cancel a bounty (only owner can cancel)
    pub fn cancel_bounty(env: Env, id: BytesN<32>) -> Bounty {
        // Get the existing bounty
        let mut bounty: Bounty = env
            .storage()
            .instance()
            .get(&DataKey::Bounty(id.clone()))
            .unwrap_or_else(|| panic!("Bounty not found"));

        // Check if caller is the owner
        let caller = env.invoker();
        if caller != bounty.owner {
            panic!("Only the owner can cancel the bounty");
        }

        // Check if bounty is already completed
        if bounty.status == BountyStatus::Completed {
            panic!("Cannot cancel a completed bounty");
        }

        // Update status to cancelled
        bounty.status = BountyStatus::Cancelled;
        bounty.updated = env.ledger().timestamp();

        // Store the updated bounty
        env.storage().instance().set(&DataKey::Bounty(id), &bounty);

        bounty
    }

    // Submit work for a bounty
    pub fn submit_work(
        env: Env,
        bounty_id: BytesN<32>,
        content: String,
    ) -> BytesN<32> {
        // Get the bounty
        let bounty: Bounty = env
            .storage()
            .instance()
            .get(&DataKey::Bounty(bounty_id.clone()))
            .unwrap_or_else(|| panic!("Bounty not found"));

        // Check if bounty is open or in progress
        if bounty.status != BountyStatus::Open && bounty.status != BountyStatus::InProgress {
            panic!("Bounty is not accepting submissions");
        }

        // Check if deadline has passed
        if env.ledger().timestamp() > bounty.deadline {
            panic!("Bounty deadline has passed");
        }

        // Get the caller as the applicant
        let applicant = env.invoker();

        // Generate a unique ID for the submission
        let id = env.crypto().sha256(&env.crypto().random());

        // Create the submission
        let submission = Submission {
            id: id.clone(),
            bounty_id: bounty_id.clone(),
            applicant,
            content,
            created: env.ledger().timestamp(),
            status: SubmissionStatus::Pending,
        };

        // Store the submission
        env.storage().instance().set(&DataKey::Submission(id.clone()), &submission);

        // Get the current list of submissions for this bounty and append the new one
        let mut submission_list: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::SubmissionList(bounty_id.clone()))
            .unwrap_or_else(|| Vec::new(&env));
        submission_list.push_back(id.clone());
        env.storage().instance().set(&DataKey::SubmissionList(bounty_id), &submission_list);

        // Update the bounty status to "in progress" if it was "open"
        if bounty.status == BountyStatus::Open {
            let mut updated_bounty = bounty;
            updated_bounty.status = BountyStatus::InProgress;
            updated_bounty.updated = env.ledger().timestamp();
            env.storage().instance().set(&DataKey::Bounty(bounty_id), &updated_bounty);
        }

        // Return the submission ID
        id
    }

    // Get all submissions for a bounty
    pub fn list_submissions(env: Env, bounty_id: BytesN<32>) -> Vec<Submission> {
        let submission_list: Vec<BytesN<32>> = env
            .storage()
            .instance()
            .get(&DataKey::SubmissionList(bounty_id))
            .unwrap_or_else(|| Vec::new(&env));

        let mut submissions = Vec::new(&env);
        for id in submission_list.iter() {
            let submission: Submission = env
                .storage()
                .instance()
                .get(&DataKey::Submission(id))
                .unwrap();
            submissions.push_back(submission);
        }
        submissions
    }

    // Get a submission by ID
    pub fn get_submission(env: Env, id: BytesN<32>) -> Submission {
        env.storage()
            .instance()
            .get(&DataKey::Submission(id))
            .unwrap_or_else(|| panic!("Submission not found"))
    }

    // Accept a submission (only bounty owner can accept)
    pub fn accept_submission(env: Env, submission_id: BytesN<32>) -> Submission {
        // Get the submission
        let mut submission: Submission = env
            .storage()
            .instance()
            .get(&DataKey::Submission(submission_id.clone()))
            .unwrap_or_else(|| panic!("Submission not found"));

        // Get the bounty
        let mut bounty: Bounty = env
            .storage()
            .instance()
            .get(&DataKey::Bounty(submission.bounty_id.clone()))
            .unwrap_or_else(|| panic!("Bounty not found"));

        // Check if caller is the bounty owner
        let caller = env.invoker();
        if caller != bounty.owner {
            panic!("Only the bounty owner can accept submissions");
        }

        // Check if bounty is not already completed or cancelled
        if bounty.status == BountyStatus::Completed || bounty.status == BountyStatus::Cancelled {
            panic!("Bounty is already completed or cancelled");
        }

        // Update submission status
        submission.status = SubmissionStatus::Accepted;
        env.storage().instance().set(&DataKey::Submission(submission_id), &submission);

        // Update bounty status
        bounty.status = BountyStatus::Completed;
        bounty.updated = env.ledger().timestamp();
        env.storage().instance().set(&DataKey::Bounty(submission.bounty_id.clone()), &bounty);

        // Transfer the reward to the applicant
        let token_client = soroban_sdk::token::Client::new(&env, &bounty.reward_asset);
        token_client.transfer(&bounty.owner, &submission.applicant, &bounty.reward_amount);

        submission
    }

    // Reject a submission (only bounty owner can reject)
    pub fn reject_submission(env: Env, submission_id: BytesN<32>) -> Submission {
        // Get the submission
        let mut submission: Submission = env
            .storage()
            .instance()
            .get(&DataKey::Submission(submission_id.clone()))
            .unwrap_or_else(|| panic!("Submission not found"));

        // Get the bounty
        let bounty: Bounty = env
            .storage()
            .instance()
            .get(&DataKey::Bounty(submission.bounty_id.clone()))
            .unwrap_or_else(|| panic!("Bounty not found"));

        // Check if caller is the bounty owner
        let caller = env.invoker();
        if caller != bounty.owner {
            panic!("Only the bounty owner can reject submissions");
        }

        // Check if submission is pending
        if submission.status != SubmissionStatus::Pending {
            panic!("Submission is not in a pending state");
        }

        // Update submission status
        submission.status = SubmissionStatus::Rejected;
        env.storage().instance().set(&DataKey::Submission(submission_id), &submission);

        submission
    }
} 