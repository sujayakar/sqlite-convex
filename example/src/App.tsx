import "./App.css";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-sql'; // Import SQL syntax
import 'prismjs/themes/prism.css'; // Import default theme

// Add type for query result
type QueryResult = string[][] | { error: string };

// Add this type definition at the top with other types
type SchemaRow = {
  type: string;
  name: string;
  tbl_name: string;
  rootpage: number;
  sql: string;
};

function App() {
  const [singleQuery, setSingleQuery] = useState("");
  const [multipleQueries, setMultipleQueries] = useState("");
  const [pendingStatements, setPendingStatements] = useState<string[]>([]);
  const [sqlInput, setSqlInput] = useState('');
  const [lastSuccessfulResults, setLastSuccessfulResults] = useState<string[][]>([]);

  // Assuming these mutations/queries exist in your Convex backend  
  const runMultipleQueries = useMutation(api.example.writeTransaction);
  const queryResults = useQuery(api.example.readTransaction, { query: singleQuery });

  // Helper to check if result is an error
  const isError = (result: QueryResult): result is { error: string } => {
    return typeof (result as any).error === 'string';
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check for Enter + Command/Control
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      executeTransaction();
      return;
    }
    // Regular Enter handling for adding statements
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (sqlInput.trim()) {
        setPendingStatements([...pendingStatements, sqlInput.trim()]);
        setSqlInput('');
      }
    }
  };

  const executeTransaction = async () => {
    if (pendingStatements.length === 0) return;
    try {
      await runMultipleQueries({ statements: pendingStatements });
      setPendingStatements([]);
    } catch (error: any) {
      alert(`Error: ${error.message}`);      
    }
  };

  // Add this helper function for SQL highlighting
  const highlightSQL = (code: string) => (
    Prism.highlight(code, Prism.languages.sql, 'sql')
  );

  const currentSchema = useQuery(api.example.readTransaction, { query: "select * from sqlite_master"});

  // Add this helper function before the return statement
  const formatSchemaResults = (results: string[][]) => {
    if (!results || results.length === 0) return null;
    
    return results.map(row => ({
      type: row[0],
      name: row[1],
      tbl_name: row[2],
      rootpage: parseInt(row[3]),
      sql: row[4]
    } as SchemaRow));
  };

  return (
    <>
      <h1>📦 SQLite fits in a component</h1>
      <h2>Run a query</h2>
      <div className="card">        
        {/* Single Query Input */}
        <div className="query-input">
        <Editor
                value={singleQuery}
                onValueChange={setSingleQuery}
                highlight={highlightSQL}
                padding={10}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 14,
                }}                
              />
        </div>

        {/* Results Table */}
        <div className="results-table">
          {queryResults === undefined ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <span>Running query...</span>
            </div>
          ) : queryResults.error ? (
            <div className="error-message" style={{ textAlign: 'left' }}>                  
              <pre>{queryResults.error}</pre>
            </div>
          ) : (
            <table className="data-table">
              <tbody>
                {queryResults.results.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell: any, j: any) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>        

        <h2>Run a transaction</h2>
        {/* Multiple Queries Section */}
        <div className="multiple-queries-section">          
          <div className="sql-input-container">
            <div className="pending-statements">
              {pendingStatements.map((stmt, index) => (
                <div key={index} className="pending-statement">
                  <div className="statement-code">
                    <Editor
                      value={stmt}
                      onValueChange={() => {}} // Read-only
                      highlight={highlightSQL}
                      disabled
                      style={{
                        fontFamily: '"Fira code", "Fira Mono", monospace',
                      }}
                    />
                  </div>
                  <button 
                    className="remove-stmt"
                    onClick={() => setPendingStatements(
                      pendingStatements.filter((_, i) => i !== index)
                    )}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="input-row">
              <Editor
                value={sqlInput}
                onValueChange={setSqlInput}
                highlight={highlightSQL}
                padding={10}
                style={{
                  fontFamily: '"Fira code", "Fira Mono", monospace',
                  fontSize: 14,
                }}
                onKeyDown={(e: any) => {
                  // Check for Enter + Command/Control
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    if (sqlInput.trim()) {
                      setPendingStatements([...pendingStatements, sqlInput.trim()]);
                      setSqlInput('');
                    }
                    executeTransaction();
                    return;
                  }
                  // Regular Enter handling
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (sqlInput.trim()) {
                      setPendingStatements([...pendingStatements, sqlInput.trim()]);
                      setSqlInput('');
                    }
                  }
                }}
              />
              <button 
                className="execute-btn"
                onClick={executeTransaction}
                disabled={pendingStatements.length === 0}
              >
                Execute
              </button>
            </div>
          </div>
        </div>

        <h2>Current Schema</h2>
        <div className="schema-view">
          {currentSchema?.results && formatSchemaResults(currentSchema.results)?.map((item, index) => (
            <div key={index} className="schema-item">
              <div className="schema-header">
                <span className="schema-type">{item.type}</span>
                <span className="schema-name">{item.name}</span>
              </div>
              <div 
                className="schema-sql"
                dangerouslySetInnerHTML={{ 
                  __html: Prism.highlight(item.sql || '', Prism.languages.sql, 'sql')
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default App;
