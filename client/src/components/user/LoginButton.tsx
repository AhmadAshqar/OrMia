import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";

export default function LoginButton() {
  return (
    <a href="/auth" className="inline-block">
      <Button 
        variant="default" 
        className="bg-[hsl(var(--gold))] hover:bg-[hsl(var(--gold-dark))] text-white gap-1"
      >
        <UserCircle className="h-5 w-5 ml-1" />
        <span>התחברות</span>
      </Button>
    </a>
  );
}