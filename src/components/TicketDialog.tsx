import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orderApi } from '@/lib/api';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface TicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number | string;
  orderSerial?: string;
  onSuccess?: () => void;
}

const issueTypes = [
  "Item not received",
  "Wrong item received",
  "Item damaged",
  "Item missing parts",
  "Quality issues",
  "Other"
];

const TicketDialog: React.FC<TicketDialogProps> = ({ 
  open, 
  onOpenChange, 
  orderId,
  orderSerial,
  onSuccess 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedIssue) {
      toast.error("Please select an issue type");
      return;
    }
    
    if (!description) {
      toast.error("Please describe your issue");
      return;
    }
    
    try {
      setIsSubmitting(true);
      await orderApi.createDispute(
        Number(orderId),
        selectedIssue,
        description,
        imageUrl || undefined,
        orderSerial || String(orderId) // Fallback to orderId if orderSerial is not provided
      );
      
      // Reset form
      setSelectedIssue("");
      setDescription("");
      setImageUrl("");
      
      // Close dialog
      onOpenChange(false);
      
      // Callback on success
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Report a problem</DialogTitle>
          <DialogClose className="absolute right-4 top-4">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="issue">I am having an issue with:</Label>
            <Select 
              value={selectedIssue} 
              onValueChange={setSelectedIssue}
            >
              <SelectTrigger id="issue">
                <SelectValue placeholder="Select an issue" />
              </SelectTrigger>
              <SelectContent>
                {issueTypes.map((issue) => (
                  <SelectItem key={issue} value={issue}>
                    {issue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Describe your issues:</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Please attach an image as evidence. Maximum upload size: 2 MB</Label>
            <div className="flex items-center gap-2">
              <Input
                id="imageUrl"
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL here"
                className="flex-1"
              />
              {/* For now we're just using a URL, but a real image upload component would go here */}
            </div>
            <p className="text-xs text-muted-foreground">
              For now, please provide a link to your image. Future updates will include direct uploads.
            </p>
          </div>
          
          <DialogFooter className="flex justify-between mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !selectedIssue || !description}
              className="min-w-[80px]"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDialog; 