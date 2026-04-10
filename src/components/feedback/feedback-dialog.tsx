"use client";

import { MessageSquareIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitFeedback } from "@/hooks/use-feedback";

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const pathname = usePathname();
  const submitFeedback = useSubmitFeedback();

  async function handleSubmit() {
    if (!message.trim()) return;
    await submitFeedback.mutateAsync({
      message: message.trim(),
      pageUrl: pathname,
    });
    setMessage("");
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setMessage("");
          submitFeedback.reset();
        }
      }}
    >
      <DialogTrigger>
        <Button variant="ghost" size="sm">
          <MessageSquareIcon className="mr-1.5 h-4 w-4" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>
            Help us improve STRABB. Bug reports, feature requests, or general feedback — all
            welcome.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          placeholder="What's on your mind?"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />

        {submitFeedback.isError && (
          <p className="text-destructive text-sm">Failed to send feedback. Please try again.</p>
        )}

        {submitFeedback.isSuccess && (
          <p className="text-sm text-green-700 dark:text-green-400">Thanks for your feedback!</p>
        )}

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!message.trim() || submitFeedback.isPending}>
            {submitFeedback.isPending ? "Sending..." : "Send feedback"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
