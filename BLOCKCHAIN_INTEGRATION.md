# Blockchain Integration Architecture

This document explains the architecture for integrating the Stellar blockchain (Soroban smart contracts) with our application.

## Overview

Our application uses a hybrid architecture that combines:

1. **On-chain data** (stored in smart contracts on the Stellar blockchain)
2. **Off-chain data** (stored in our database)

This approach minimizes blockchain storage costs (which can be expensive) while maintaining security and transparency for critical data.

## Data Storage Split

### On-chain (Blockchain)
- Bounty ID
- Title
- Reward amount and token
- Owner address
- Deadlines (submission, judging)
- Distribution percentages
- Status

### Off-chain (Database)
- Detailed descriptions
- Categories
- Skills/tags
- Extra requirements
- Full submission content

## Flow Diagrams

### Creating a Bounty

```
┌───────────┐          ┌───────────┐          ┌───────────┐
│  Frontend │          │ Blockchain│          │  Backend  │
└─────┬─────┘          └─────┬─────┘          └─────┬─────┘
      │                      │                      │
      │ 1. User fills form   │                      │
      │ ─────────────────────│                      │
      │                      │                      │
      │ 2. Submit critical   │                      │
      │ data to blockchain   │                      │
      │ ─────────────────────>                      │
      │                      │                      │
      │                      │ 3. Create bounty and │
      │                      │ return ID            │
      │ <─────────────────────                      │
      │                      │                      │
      │ 4. Send ID + details │                      │
      │ to backend           │                      │
      │ ───────────────────────────────────────────>│
      │                      │                      │
      │                      │                      │ 5. Store details
      │                      │                      │ with blockchain ID
      │                      │                      │
      │ <───────────────────────────────────────────│
      │                      │                      │
      │ 6. Complete          │                      │
      │                      │                      │
```

### Fetching Bounty Data

```
┌───────────┐          ┌───────────┐          ┌───────────┐
│  Frontend │          │ Blockchain│          │  Backend  │
└─────┬─────┘          └─────┬─────┘          └─────┬─────┘
      │                      │                      │
      │ 1. Request bounty    │                      │
      │ ───────────────────────────────────────────>│
      │                      │                      │
      │                      │                      │ 2. Get on-chain data
      │                      │ <─────────────────────
      │                      │                      │
      │                      │ 3. Return on-chain   │
      │                      │ data                 │
      │                      │ ─────────────────────>
      │                      │                      │
      │                      │                      │ 4. Get off-chain data
      │                      │                      │ from database
      │                      │                      │
      │                      │                      │ 5. Combine data
      │                      │                      │
      │ <───────────────────────────────────────────│
      │                      │                      │ 6. Return complete data
      │ 7. Display bounty    │                      │
      │                      │                      │
```

## Implementation

### Core Components

1. **SorobanService** (`src/lib/soroban.ts`)
   - Handles direct blockchain interactions using Soroban SDK
   - Methods for creating, updating, deleting bounties and handling submissions

2. **BountyService** (`src/lib/bountyService.ts`) 
   - Coordinates between blockchain and database
   - Combines on-chain and off-chain data
   - Provides unified interface for application

3. **Blockchain Utilities** (`src/utils/blockchain.ts`)
   - Frontend utility functions for blockchain operations
   - Handles wallet connectivity and transaction creation

4. **API Routes** (`src/app/api/*`)
   - Updated to handle two-phase operations
   - Provides endpoints for saving off-chain data

### Using in Components

#### Creating a Bounty

```jsx
// 1. Import the blockchain utility
import { createBountyOnChain } from '@/utils/blockchain';

// 2. Call the blockchain function first
const bountyId = await createBountyOnChain({
  userPublicKey,  // from wallet
  title,
  token,
  reward,
  distribution,
  submissionDeadline,
  judgingDeadline,
});

// 3. Then save additional data to the backend
await fetch('/api/bounties', {
  method: 'POST',
  body: JSON.stringify({
    blockchainBountyId: bountyId,
    description,
    category,
    skills,
  }),
});
```

#### Submitting Work

```jsx
// 1. Import the blockchain utility
import { submitWorkOnChain } from '@/utils/blockchain';

// 2. Call the blockchain function first
const submissionId = await submitWorkOnChain({
  userPublicKey,  // from wallet
  bountyId,
  content: shortDescription,
});

// 3. Then save detailed submission to the backend
await fetch(`/api/bounties/${bountyId}/submissions`, {
  method: 'POST',
  body: JSON.stringify({
    blockchainSubmissionId: submissionId,
    applicantAddress: userPublicKey,
    content: detailedDescription,
  }),
});
```

## Benefits

- **Cost efficiency**: Only essential data stored on-chain
- **Security**: Critical financial data and ownership secured by blockchain
- **User experience**: Single API call for reads, two-phase process for writes
- **Flexibility**: Easy to add additional off-chain data without changing smart contracts

## Future Enhancements

- Add a cache layer to reduce blockchain calls
- Implement real-time synchronization of on-chain events
- Add error recovery for failed transactions 