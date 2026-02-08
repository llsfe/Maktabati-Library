import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <CardContent className="pt-6 pb-6 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          
          <h1 className="text-3xl font-bold text-foreground font-cairo">404 - صفحة غير موجودة</h1>
          <p className="text-muted-foreground text-sm font-medium">
            عذراً، الصفحة التي تحاول الوصول إليها غير متوفرة.
          </p>

          <div className="pt-4">
            <Link href="/">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-12">
                العودة إلى المكتبة
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
