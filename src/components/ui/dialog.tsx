'use client';

import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion';
import * as React from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogOverlay = React.forwardRef<
  HTMLDivElement,
  Omit<HTMLMotionProps<'div'>, 'ref'>
>(({ className, ...props }, ref) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    ref={ref}
    className={`fixed inset-0 z-10 bg-black/80 backdrop-blur-sm ${
      className || ''
    }`}
    {...props}
  />
));
DialogOverlay.displayName = 'DialogOverlay';

const DialogContent = React.forwardRef<
  HTMLDivElement,
  Omit<HTMLMotionProps<'div'>, 'ref'> & { children: React.ReactNode }
>(({ className, children, ...props }, ref) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      ref={ref}
      className={`w-full max-w-lg rounded-xl bg-[#262626] p-6 shadow-lg ${
        className || ''
      }`}
      {...props}
    >
      {children}
    </motion.div>
  </div>
));
DialogContent.displayName = 'DialogContent';

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col space-y-1.5 text-left ${className || ''}`}
    {...props}
  />
));
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${
      className || ''
    }`}
    {...props}
  />
));
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-xl font-semibold leading-none tracking-tight ${
      className || ''
    }`}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-gray-300 ${className || ''}`}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  // Prevent body scrolling when dialog is open
  React.useEffect(() => {
    if (open) {
      // Save the current overflow value
      const originalStyle = window.getComputedStyle(document.body).overflow;

      // Prevent scrolling on the body
      document.body.style.overflow = 'hidden';

      // Restore original overflow when dialog closes
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <dialog
          open={open}
          onClose={() => onOpenChange(false)}
          className="fixed inset-0 z-50 bg-transparent"
        >
          <DialogOverlay onClick={() => onOpenChange(false)} />
          {children}
        </dialog>
      )}
    </AnimatePresence>
  );
}

Dialog.Content = DialogContent;
Dialog.Header = DialogHeader;
Dialog.Footer = DialogFooter;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
