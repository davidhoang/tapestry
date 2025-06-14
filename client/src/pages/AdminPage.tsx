
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Database, Play, AlertCircle, CheckCircle } from "lucide-react";

interface QueryResult {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
}

export default function AdminPage() {
  const [query, setQuery] = useState("");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);

  // Fetch available tables
  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ["/api/admin/db/tables"],
    queryFn: async () => {
      const response = await fetch("/api/admin/db/tables");
      if (!response.ok) {
        throw new Error("Failed to fetch tables");
      }
      return response.json();
    },
  });

  // Execute query mutation
  const executeQuery = useMutation({
    mutationFn: async (sqlQuery: string) => {
      const response = await fetch("/api/admin/db/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sqlQuery }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      setQueryResult(data);
    },
  });

  const handleExecuteQuery = () => {
    if (query.trim()) {
      executeQuery.mutate(query);
    }
  };

  const getCommonQueries = () => [
    {
      name: "View all users",
      query: "SELECT id, email, is_admin, created_at FROM users ORDER BY created_at DESC;",
    },
    {
      name: "View all designers",
      query: "SELECT id, name, email, company, level, available FROM designers ORDER BY created_at DESC LIMIT 10;",
    },
    {
      name: "View all lists",
      query: "SELECT id, name, description, is_public, created_at FROM lists ORDER BY created_at DESC LIMIT 10;",
    },
    {
      name: "Count records by table",
      query: `
        SELECT 
          'users' as table_name, COUNT(*) as count FROM users
        UNION ALL
        SELECT 
          'designers' as table_name, COUNT(*) as count FROM designers
        UNION ALL
        SELECT 
          'lists' as table_name, COUNT(*) as count FROM lists
        UNION ALL
        SELECT 
          'list_designers' as table_name, COUNT(*) as count FROM list_designers;
      `,
    },
  ];

  const renderResults = () => {
    if (!queryResult) return null;

    if (!queryResult.success) {
      return (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{queryResult.error}</AlertDescription>
        </Alert>
      );
    }

    if (!queryResult.data || queryResult.data.length === 0) {
      return (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Query executed successfully. {queryResult.rowCount || 0} rows affected.
          </AlertDescription>
        </Alert>
      );
    }

    const data = queryResult.data;
    const columns = Object.keys(data[0] || {});

    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Query executed successfully. {data.length} rows returned.
          </AlertDescription>
        </Alert>
        
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column}>{column}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column}>
                      {typeof row[column] === 'boolean' ? (
                        <Badge variant={row[column] ? "default" : "secondary"}>
                          {row[column] ? "Yes" : "No"}
                        </Badge>
                      ) : (
                        String(row[column] || "")
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center gap-2 mb-8">
        <Database className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Database Admin</h1>
      </div>

      <div className="grid gap-6">
        {/* Tables Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
          </CardHeader>
          <CardContent>
            {tablesLoading ? (
              <div>Loading tables...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tables?.map((table: any) => (
                  <Badge key={table.table_name} variant="outline">
                    {table.table_name}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Common Queries */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {getCommonQueries().map((queryItem, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto p-3 text-left"
                  onClick={() => setQuery(queryItem.query)}
                >
                  <div>
                    <div className="font-medium">{queryItem.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {queryItem.query.slice(0, 100)}...
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Query Editor */}
        <Card>
          <CardHeader>
            <CardTitle>SQL Query Editor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Enter your SQL query here..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Supported operations: SELECT, INSERT, UPDATE, DELETE
                </div>
                <Button 
                  onClick={handleExecuteQuery}
                  disabled={!query.trim() || executeQuery.isPending}
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  {executeQuery.isPending ? "Executing..." : "Execute Query"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Results */}
            <div className="space-y-4">
              <h3 className="font-semibold">Results</h3>
              {renderResults()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
