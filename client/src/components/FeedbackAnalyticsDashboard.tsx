import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Star, AlertTriangle } from "lucide-react";

interface FeedbackAnalytics {
  totalFeedback: number;
  feedbackByType: {
    irrelevant_experience: number;
    under_qualified: number;
    over_qualified: number;
    location_mismatch: number;
    good_match: number;
  };
  averageMatchScore: number;
  averageRating: number;
  commonConcerns: string[];
  recentTrends: Array<{
    type: string;
    total: number;
    recent: number;
  }>;
}

export default function FeedbackAnalyticsDashboard() {
  const { data: analytics, isLoading, error } = useQuery<FeedbackAnalytics>({
    queryKey: ["/api/recommendations/feedback/analytics"],
    queryFn: async () => {
      const response = await fetch("/api/recommendations/feedback/analytics");
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <Card className="border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>Unable to load feedback analytics</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const feedbackTypeLabels = {
    good_match: "Good Matches",
    irrelevant_experience: "Irrelevant Experience",
    under_qualified: "Under-qualified",
    over_qualified: "Over-qualified",
    location_mismatch: "Location Mismatch",
  };

  const feedbackTypeColors = {
    good_match: "bg-green-500",
    irrelevant_experience: "bg-red-500",
    under_qualified: "bg-orange-500",
    over_qualified: "bg-blue-500",
    location_mismatch: "bg-purple-500",
  };

  const successRate = analytics.totalFeedback > 0 
    ? Math.round((analytics.feedbackByType.good_match / analytics.totalFeedback) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Feedback */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalFeedback}</div>
            <p className="text-xs text-muted-foreground">
              Recommendation evaluations
            </p>
          </CardContent>
        </Card>

        {/* Success Rate */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{successRate}%</div>
            <Progress value={successRate} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Good matches vs total feedback
            </p>
          </CardContent>
        </Card>

        {/* Average Match Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Match Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageMatchScore}%</div>
            <div className="flex items-center space-x-1 mt-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-muted-foreground">AI confidence</span>
            </div>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg User Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : "N/A"}
            </div>
            <div className="flex items-center space-x-1 mt-1">
              {analytics.averageRating > 0 && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${
                        i < Math.round(analytics.averageRating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Feedback Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(analytics.feedbackByType).map(([type, count]) => {
              const percentage = analytics.totalFeedback > 0 
                ? Math.round((count / analytics.totalFeedback) * 100)
                : 0;
              
              return (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      {feedbackTypeLabels[type as keyof typeof feedbackTypeLabels]}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {count} ({percentage}%)
                    </Badge>
                  </div>
                  <Progress 
                    value={percentage} 
                    className="h-2"
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Trends (30 days)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analytics.recentTrends.map((trend) => {
              const changePercent = trend.total > 0 
                ? Math.round(((trend.recent / trend.total) * 100))
                : 0;
              const isIncreasing = trend.recent > (trend.total - trend.recent);
              
              return (
                <div key={trend.type} className="flex items-center justify-between">
                  <span className="text-sm">
                    {feedbackTypeLabels[trend.type as keyof typeof feedbackTypeLabels]}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {trend.recent} recent
                    </span>
                    {trend.type !== 'good_match' && (
                      <div className={`flex items-center space-x-1 ${
                        isIncreasing ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {isIncreasing ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span className="text-xs">{changePercent}%</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Common Concerns */}
      {analytics.commonConcerns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Common Feedback Themes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analytics.commonConcerns.map((concern) => (
                <Badge key={concern} variant="outline" className="capitalize">
                  {concern}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Keywords frequently mentioned in feedback comments
            </p>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>RLHF Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            {successRate < 60 && (
              <div className="flex items-start space-x-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Low Success Rate Detected
                  </p>
                  <p className="text-xs text-amber-700">
                    Consider adjusting matching criteria or gathering more specific feedback to improve AI recommendations.
                  </p>
                </div>
              </div>
            )}
            
            {analytics.feedbackByType.location_mismatch > analytics.feedbackByType.good_match && (
              <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Location Matching Issues
                  </p>
                  <p className="text-xs text-blue-700">
                    High location mismatch feedback suggests the AI needs better location preference understanding.
                  </p>
                </div>
              </div>
            )}

            {analytics.totalFeedback >= 10 && (
              <div className="flex items-start space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    RLHF Learning Active
                  </p>
                  <p className="text-xs text-green-700">
                    With {analytics.totalFeedback} feedback entries, the enhanced recommendation system is now learning from your preferences.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}