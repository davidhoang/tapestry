import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import FeedbackAnalyticsDashboard from "@/components/FeedbackAnalyticsDashboard";

export default function FeedbackAnalyticsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/hiring">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Hiring
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-serif">RLHF Analytics</h1>
            <p className="text-muted-foreground">
              Recommendation feedback and machine learning insights
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Feedback Learning</span>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reinforcement Learning from Human Feedback (RLHF)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This system learns from your feedback on AI recommendations to improve future matches. 
              Each time you rate a recommendation, the AI incorporates that feedback to make better suggestions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Feedback Types:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Good match - Designer fits the role well</li>
                  <li>• Irrelevant experience - Background doesn't align</li>
                  <li>• Under-qualified - Lacks necessary skills</li>
                  <li>• Over-qualified - Too experienced for the role</li>
                  <li>• Location mismatch - Geographic constraints</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Learning Benefits:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Higher quality recommendations over time</li>
                  <li>• Reduced irrelevant matches</li>
                  <li>• Better understanding of your preferences</li>
                  <li>• Improved location and skill matching</li>
                  <li>• Enhanced confidence scoring</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Dashboard */}
      <FeedbackAnalyticsDashboard />
    </div>
  );
}