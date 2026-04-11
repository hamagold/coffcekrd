import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminPayments from '@/components/admin/AdminPayments';
import { toast } from 'sonner';
import { 
  Lock, Database, Table2, RefreshCw, Trash2, Download, 
  Settings, Key, Shield, Eye, EyeOff, Terminal, 
  AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronRight, CreditCard,
  FileJson, Copy, Code, Save, Pencil, Plus, X, Play, History,
  Upload, ArrowRightLeft, Loader2, HardDrive
} from 'lucide-react';
import StorageSettings from '@/components/settings/StorageSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

const DEV_PASSWORD = 'hamagold2026';

interface TableInfo {
  name: string;
  rowCount: number;
  columns: string[];
}

const DevPanel = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [appSettings, setAppSettings] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [editingRow, setEditingRow] = useState<{ idx: number; data: any } | null>(null);
  const [newRowJson, setNewRowJson] = useState('');
  const [showAddRow, setShowAddRow] = useState(false);
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM app_settings LIMIT 10;');
  const [sqlResult, setSqlResult] = useState<any[] | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [sqlHistory, setSqlHistory] = useState<string[]>([]);
  const [importJson, setImportJson] = useState('');
  const [migrationStatus, setMigrationStatus] = useState<{ table: string; status: string; count: number }[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev.slice(0, 99)]);
  };

  const handleLogin = () => {
    if (password === DEV_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('dev_auth', 'true');
      addLog('✅ Developer authenticated successfully');
      toast.success('Welcome, Developer!');
    } else {
      addLog('❌ Failed authentication attempt');
      toast.error('Incorrect password');
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem('dev_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const fetchTables = async () => {
    setLoading(true);
    addLog('📊 Fetching database tables...');
    
    const tableNames = ['app_settings', 'menu_categories', 'menu_items', 'orders', 'profiles', 'user_roles'];
    const tableInfos: TableInfo[] = [];

    for (const tableName of tableNames) {
      try {
        const { data, count } = await supabase
          .from(tableName as any)
          .select('*', { count: 'exact', head: true });
        
        tableInfos.push({
          name: tableName,
          rowCount: count || 0,
          columns: []
        });
      } catch (e) {
        addLog(`⚠️ Could not fetch ${tableName}`);
      }
    }

    setTables(tableInfos);
    addLog(`✅ Found ${tableInfos.length} tables`);
    setLoading(false);
  };

  const fetchTableData = async (tableName: string) => {
    setLoading(true);
    setSelectedTable(tableName);
    addLog(`📋 Loading data from ${tableName}...`);

    const { data, error } = await supabase
      .from(tableName as any)
      .select('*')
      .limit(100);

    if (error) {
      addLog(`❌ Error: ${error.message}`);
      toast.error(error.message);
    } else {
      setTableData(data || []);
      addLog(`✅ Loaded ${data?.length || 0} rows from ${tableName}`);
    }
    setLoading(false);
  };

  const fetchAppSettings = async () => {
    setLoading(true);
    addLog('⚙️ Loading app settings...');

    const { data, error } = await supabase
      .from('app_settings')
      .select('*');

    if (error) {
      addLog(`❌ Error: ${error.message}`);
    } else {
      setAppSettings(data || []);
      addLog(`✅ Loaded ${data?.length || 0} settings`);
    }
    setLoading(false);
  };

  const exportData = (data: any[], filename: string) => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog(`📥 Exported ${filename}`);
    toast.success(`Exported ${filename}`);
  };

  const clearLocalStorage = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('plc_'));
    keys.forEach(k => localStorage.removeItem(k));
    addLog(`🗑️ Cleared ${keys.length} localStorage items`);
    toast.success(`Cleared ${keys.length} items from localStorage`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const startEditRow = (idx: number) => {
    setEditingRow({ idx, data: { ...tableData[idx] } });
  };

  const handleEditField = (key: string, value: string) => {
    if (!editingRow) return;
    const updated = { ...editingRow.data };
    // Try to parse JSON for object/array fields
    try {
      const parsed = JSON.parse(value);
      updated[key] = parsed;
    } catch {
      // Try number
      if (value !== '' && !isNaN(Number(value)) && typeof editingRow.data[key] === 'number') {
        updated[key] = Number(value);
      } else if (value === 'true') {
        updated[key] = true;
      } else if (value === 'false') {
        updated[key] = false;
      } else {
        updated[key] = value;
      }
    }
    setEditingRow({ ...editingRow, data: updated });
  };

  const saveEditRow = async () => {
    if (!editingRow || !selectedTable) return;
    setLoading(true);
    const row = editingRow.data;
    const id = row.id;
    
    // Remove id from update payload
    const { id: _id, ...updateData } = row;
    
    const { error } = await supabase
      .from(selectedTable as any)
      .update(updateData)
      .eq('id', id);

    if (error) {
      addLog(`❌ Update failed: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    } else {
      addLog(`✅ Updated row ${id} in ${selectedTable}`);
      toast.success('Row updated successfully');
      setEditingRow(null);
      fetchTableData(selectedTable);
    }
    setLoading(false);
  };

  const deleteRow = async (row: any) => {
    if (!selectedTable) return;
    if (!confirm('Are you sure you want to delete this row?')) return;
    setLoading(true);

    const { error } = await supabase
      .from(selectedTable as any)
      .delete()
      .eq('id', row.id);

    if (error) {
      addLog(`❌ Delete failed: ${error.message}`);
      toast.error(`Error: ${error.message}`);
    } else {
      addLog(`🗑️ Deleted row ${row.id} from ${selectedTable}`);
      toast.success('Row deleted');
      fetchTableData(selectedTable);
    }
    setLoading(false);
  };

  const addNewRow = async () => {
    if (!selectedTable || !newRowJson.trim()) return;
    setLoading(true);
    try {
      const parsed = JSON.parse(newRowJson);
      const { error } = await supabase
        .from(selectedTable as any)
        .insert(parsed);

      if (error) {
        addLog(`❌ Insert failed: ${error.message}`);
        toast.error(`Error: ${error.message}`);
      } else {
        addLog(`✅ Inserted new row into ${selectedTable}`);
        toast.success('Row added');
        setNewRowJson('');
        setShowAddRow(false);
        fetchTableData(selectedTable);
      }
    } catch {
      toast.error('Invalid JSON');
    }
    setLoading(false);
  };

  const runSql = async () => {
    if (!sqlQuery.trim()) return;
    setLoading(true);
    setSqlError(null);
    setSqlResult(null);
    addLog(`🔍 Running SQL: ${sqlQuery.slice(0, 80)}...`);

    try {
      const { data, error } = await supabase.functions.invoke('run-sql', {
        body: { query: sqlQuery, dev_password: DEV_PASSWORD },
      });

      if (error) {
        setSqlError(error.message);
        addLog(`❌ SQL Error: ${error.message}`);
      } else if (data?.error) {
        setSqlError(data.error);
        addLog(`❌ SQL Error: ${data.error}`);
      } else {
        const result = data?.data || [];
        setSqlResult(Array.isArray(result) ? result : [result]);
        addLog(`✅ SQL returned ${Array.isArray(result) ? result.length : 1} rows`);
        // Add to history
        setSqlHistory(prev => {
          const updated = [sqlQuery, ...prev.filter(q => q !== sqlQuery)].slice(0, 20);
          return updated;
        });
      }
    } catch (err) {
      setSqlError(String(err));
      addLog(`❌ SQL Error: ${String(err)}`);
    }
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">Developer Access</CardTitle>
            <CardDescription>Enter password to access developer tools</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="pr-10"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <Button onClick={handleLogin} className="w-full gap-2">
              <Key className="w-4 h-4" /> Authenticate
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Code className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Developer Panel</h1>
              <p className="text-xs text-muted-foreground">System management & debugging tools</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => {
            sessionStorage.removeItem('dev_auth');
            setIsAuthenticated(false);
          }}>
            <Lock className="w-4 h-4 mr-2" /> Lock
          </Button>
        </div>

        <Tabs defaultValue="database" className="w-full">
          <TabsList className="w-full grid grid-cols-8 h-11">
            <TabsTrigger value="export" className="gap-1 text-[10px] px-2">
              <Download className="w-3.5 h-3.5" /> Export All
            </TabsTrigger>
            <TabsTrigger value="database" className="gap-1 text-[10px] px-2">
              <Database className="w-3.5 h-3.5" /> Database
            </TabsTrigger>
            <TabsTrigger value="sql" className="gap-1 text-[10px] px-2">
              <Play className="w-3.5 h-3.5" /> SQL
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-1 text-[10px] px-2">
              <CreditCard className="w-3.5 h-3.5" /> Payments
            </TabsTrigger>
            <TabsTrigger value="storage" className="gap-1 text-[10px] px-2">
              <HardDrive className="w-3.5 h-3.5" /> Storage
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1 text-[10px] px-2">
              <Settings className="w-3.5 h-3.5" /> Settings
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1 text-[10px] px-2">
              <Terminal className="w-3.5 h-3.5" /> Logs
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-1 text-[10px] px-2">
              <Shield className="w-3.5 h-3.5" /> Tools
            </TabsTrigger>
          </TabsList>

          {/* Database Tab */}
          {/* Export All Tab */}
          <TabsContent value="export" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Download className="w-5 h-5 text-primary" /> Export Entire Database
                </CardTitle>
                <CardDescription>
                  Download all tables, rows, and data in JSON or MySQL format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {exportLoading && (
                  <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-sm text-foreground">{exportProgress}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* JSON Export */}
                  <Card className="border-2 border-primary/20 hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileJson className="w-5 h-5 text-blue-500" /> Export as JSON
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Full database export with all tables and rows in JSON format
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={async () => {
                          setExportLoading(true);
                          const allTableNames = ['app_settings', 'menu_categories', 'menu_items', 'menu_item_variants', 'orders', 'profiles', 'user_roles', 'plc_sessions'];
                          const fullExport: Record<string, any> = { exported_at: new Date().toISOString(), tables: {} };

                          // Pre-fetch email lookup
                          const { data: authUsersData } = await supabase.rpc('exec_sql', { query_text: `SELECT id, email FROM auth.users` });
                          const emailMap: Record<string, string> = {};
                          if (Array.isArray(authUsersData)) {
                            authUsersData.forEach((u: any) => { emailMap[u.id] = u.email; });
                          }

                          for (const tbl of allTableNames) {
                            setExportProgress(`Fetching ${tbl}...`);
                            try {
                              // Use exec_sql to bypass RLS for full export
                              const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', { query_text: `SELECT * FROM ${tbl}` });
                              let rows = Array.isArray(rpcData) ? rpcData : [];
                              // Replace user_id/id UUIDs with emails for readability
                              if (tbl === 'user_roles') {
                                rows = rows.map((r: any) => ({ ...r, user_email: emailMap[r.user_id] || r.user_id }));
                              }
                              if (tbl === 'profiles') {
                                rows = rows.map((r: any) => ({ ...r, email: emailMap[r.id] || r.id }));
                              }
                              if (!rpcError) {
                                (fullExport.tables as any)[tbl] = { row_count: rows.length, rows };
                                addLog(`✅ Exported ${tbl}: ${rows.length} rows`);
                              } else {
                                (fullExport.tables as any)[tbl] = { error: rpcError?.message || 'No data', rows: [] };
                              }
                            } catch (e) {
                              (fullExport.tables as any)[tbl] = { error: String(e), rows: [] };
                            }
                          }

                          const json = JSON.stringify(fullExport, null, 2);
                          const blob = new Blob([json], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `full_database_export_${new Date().toISOString().split('T')[0]}.json`;
                          a.click();
                          URL.revokeObjectURL(url);
                          setExportLoading(false);
                          setExportProgress('');
                          addLog('📥 Full JSON export completed');
                          toast.success('Full database exported as JSON!');
                        }}
                        disabled={exportLoading}
                        className="w-full gap-2"
                        size="lg"
                      >
                        <Download className="w-5 h-5" /> Download JSON
                      </Button>
                    </CardContent>
                  </Card>

                  {/* MySQL Export */}
                  <Card className="border-2 border-orange-500/20 hover:border-orange-500/50 transition-colors">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Database className="w-5 h-5 text-orange-500" /> Export as MySQL / SQL
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Full database export as SQL INSERT statements compatible with MySQL
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={async () => {
                          setExportLoading(true);
                          const allTableNames = ['app_settings', 'menu_categories', 'menu_items', 'menu_item_variants', 'orders', 'profiles', 'user_roles', 'plc_sessions'];
                          let sql = `-- Full Database Export\n-- Generated: ${new Date().toISOString()}\n-- Tables: ${allTableNames.join(', ')}\n\n`;

                          // Pre-fetch email lookup for readable export
                          const { data: authUsersData2 } = await supabase.rpc('exec_sql', { query_text: `SELECT id, email FROM auth.users` });
                          const emailMap2: Record<string, string> = {};
                          if (Array.isArray(authUsersData2)) {
                            authUsersData2.forEach((u: any) => { emailMap2[u.id] = u.email; });
                          }

                          for (const tbl of allTableNames) {
                            setExportProgress(`Fetching ${tbl}...`);
                            try {
                              // Use exec_sql to bypass RLS for full export
                              const { data: rpcData, error } = await supabase.rpc('exec_sql', { query_text: `SELECT * FROM ${tbl}` });
                              let data = Array.isArray(rpcData) ? rpcData : [];
                              // Replace user_id/id UUIDs with emails for readability
                              if (tbl === 'user_roles') {
                                data = data.map((r: any) => ({ ...r, user_email: emailMap2[r.user_id] || r.user_id }));
                              }
                              if (tbl === 'profiles') {
                                data = data.map((r: any) => ({ ...r, email: emailMap2[r.id] || r.id }));
                              }
                              if (!error && data.length > 0) {
                                sql += `-- ========================================\n`;
                                sql += `-- Table: ${tbl} (${data.length} rows)\n`;
                                sql += `-- ========================================\n\n`;

                                // CREATE TABLE
                                const columns = Object.keys(data[0]);
                                sql += `CREATE TABLE IF NOT EXISTS \`${tbl}\` (\n`;
                                sql += columns.map(col => {
                                  const sampleVal = data[0][col];
                                  let colType = 'TEXT';
                                  if (typeof sampleVal === 'number') colType = Number.isInteger(sampleVal) ? 'INT' : 'DECIMAL(10,2)';
                                  else if (typeof sampleVal === 'boolean') colType = 'BOOLEAN';
                                  else if (typeof sampleVal === 'object' && sampleVal !== null) colType = 'JSON';
                                  else if (col === 'id') colType = 'VARCHAR(36)';
                                  else if (col.includes('_at') || col.includes('created') || col.includes('updated')) colType = 'TIMESTAMP';
                                  if (col === 'id') return `  \`${col}\` ${colType} PRIMARY KEY`;
                                  return `  \`${col}\` ${colType}`;
                                }).join(',\n');
                                sql += `\n);\n\n`;

                                // INSERT statements
                                for (const row of data) {
                                  const vals = columns.map(col => {
                                    const v = row[col];
                                    if (v === null || v === undefined) return 'NULL';
                                    if (typeof v === 'number' || typeof v === 'boolean') return String(v);
                                    if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "\\'")}'`;
                                    return `'${String(v).replace(/'/g, "\\'")}'`;
                                  });
                                  sql += `INSERT INTO \`${tbl}\` (${columns.map(c => `\`${c}\``).join(', ')}) VALUES (${vals.join(', ')});\n`;
                                }
                                sql += `\n`;
                                addLog(`✅ Exported ${tbl}: ${data.length} rows as SQL`);
                              } else {
                                sql += `-- Table: ${tbl} (empty or error: ${error?.message || 'no data'})\n\n`;
                              }
                            } catch (e) {
                              sql += `-- Table: ${tbl} (error: ${String(e)})\n\n`;
                            }
                          }

                          const blob = new Blob([sql], { type: 'text/sql' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `full_database_export_${new Date().toISOString().split('T')[0]}.sql`;
                          a.click();
                          URL.revokeObjectURL(url);
                          setExportLoading(false);
                          setExportProgress('');
                          addLog('📥 Full MySQL/SQL export completed');
                          toast.success('Full database exported as SQL!');
                        }}
                        disabled={exportLoading}
                        className="w-full gap-2 bg-orange-600 hover:bg-orange-700"
                        size="lg"
                      >
                        <Download className="w-5 h-5" /> Download SQL
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Export per table */}
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Export Individual Tables</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {['app_settings', 'menu_categories', 'menu_items', 'menu_item_variants', 'orders', 'profiles', 'user_roles', 'plc_sessions'].map(tbl => (
                        <Button
                          key={tbl}
                          variant="outline"
                          size="sm"
                          className="text-xs justify-start gap-2"
                          disabled={exportLoading}
                          onClick={async () => {
                            setExportLoading(true);
                            setExportProgress(`Exporting ${tbl}...`);
                            const { data, error } = await supabase.from(tbl as any).select('*');
                            if (!error && data) {
                              exportData(data, tbl);
                            } else {
                              toast.error(`Error exporting ${tbl}: ${error?.message}`);
                            }
                            setExportLoading(false);
                            setExportProgress('');
                          }}
                        >
                          <Table2 className="w-3 h-3" /> {tbl}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-4 mt-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={fetchTables} disabled={loading} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Tables
              </Button>
              {selectedTable && (
                <>
                  <Button onClick={() => exportData(tableData, selectedTable)} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" /> Export {selectedTable}
                  </Button>
                  <Button onClick={() => { setShowAddRow(!showAddRow); setNewRowJson('{\n  \n}'); }} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Add Row
                  </Button>
                </>
              )}
            </div>

            {/* Add New Row */}
            {showAddRow && selectedTable && (
              <Card className="border-primary/30">
                <CardHeader className="py-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Plus className="w-4 h-4 text-primary" /> Insert into {selectedTable}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <textarea
                    value={newRowJson}
                    onChange={(e) => setNewRowJson(e.target.value)}
                    className="w-full h-32 bg-secondary text-foreground font-mono text-xs p-3 rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder='{"key": "value"}'
                  />
                  <div className="flex gap-2">
                    <Button onClick={addNewRow} size="sm" disabled={loading}>
                      <Save className="w-4 h-4 mr-2" /> Insert
                    </Button>
                    <Button onClick={() => setShowAddRow(false)} variant="ghost" size="sm">
                      <X className="w-4 h-4 mr-2" /> Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Tables List */}
              <div className="lg:col-span-1 space-y-2">
                <h3 className="text-sm font-semibold text-foreground mb-2">Tables</h3>
                {tables.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Click "Refresh Tables" to load</p>
                ) : (
                  tables.map(t => (
                    <button
                      key={t.name}
                      onClick={() => { fetchTableData(t.name); setEditingRow(null); setShowAddRow(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                        selectedTable === t.name 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-card hover:bg-accent border border-border'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Table2 className="w-4 h-4" /> {t.name}
                      </span>
                      <span className="text-xs opacity-70">{t.rowCount}</span>
                    </button>
                  ))
                )}
              </div>

              {/* Table Data */}
              <div className="lg:col-span-3">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileJson className="w-4 h-4" />
                      {selectedTable || 'Select a table'}
                      {tableData.length > 0 && (
                        <span className="text-xs text-muted-foreground font-normal">
                          ({tableData.length} rows)
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {tableData.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground text-sm">
                        Select a table to view data
                      </div>
                    ) : (
                      <div className="max-h-[600px] overflow-auto">
                        {tableData.map((row, idx) => (
                          <div key={idx} className="border-b border-border">
                            <button
                              onClick={() => toggleRow(idx)}
                              className="w-full px-4 py-2 flex items-center justify-between hover:bg-accent/50 text-left"
                            >
                              <span className="text-xs text-foreground font-mono truncate max-w-[70%]">
                                {row.id ? `${String(row.id).slice(0, 8)}...` : ''} {row.key || row.name || row.name_en || row.order_number || row.item_id || row.cat_id || ''}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); startEditRow(idx); }}
                                  className="p-1 hover:bg-primary/10 rounded text-primary"
                                  title="Edit"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteRow(row); }}
                                  className="p-1 hover:bg-destructive/10 rounded text-destructive"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                {expandedRows.has(idx) ? (
                                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                            </button>

                            {/* Edit Mode */}
                            {editingRow?.idx === idx && (
                              <div className="px-4 py-3 bg-primary/5 border-t border-primary/20 space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-primary flex items-center gap-1">
                                    <Pencil className="w-3 h-3" /> Editing Row
                                  </span>
                                  <div className="flex gap-2">
                                    <Button onClick={saveEditRow} size="sm" disabled={loading} className="h-7 text-xs">
                                      <Save className="w-3 h-3 mr-1" /> Save
                                    </Button>
                                    <Button onClick={() => setEditingRow(null)} variant="ghost" size="sm" className="h-7 text-xs">
                                      <X className="w-3 h-3 mr-1" /> Cancel
                                    </Button>
                                  </div>
                                </div>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                  {Object.entries(editingRow.data).map(([key, value]) => (
                                    <div key={key} className="flex items-start gap-2">
                                      <label className="text-[10px] font-mono text-muted-foreground min-w-[120px] pt-2 shrink-0">{key}</label>
                                      {typeof value === 'object' && value !== null ? (
                                        <textarea
                                          value={JSON.stringify(value, null, 2)}
                                          onChange={(e) => handleEditField(key, e.target.value)}
                                          className="flex-1 bg-background border border-border rounded-md px-2 py-1.5 text-xs font-mono resize-y min-h-[60px] focus:outline-none focus:ring-1 focus:ring-primary"
                                          disabled={key === 'id'}
                                        />
                                      ) : (
                                        <Input
                                          value={String(value ?? '')}
                                          onChange={(e) => handleEditField(key, e.target.value)}
                                          className="flex-1 h-8 text-xs font-mono"
                                          disabled={key === 'id'}
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* View Mode */}
                            {expandedRows.has(idx) && editingRow?.idx !== idx && (
                              <div className="px-4 py-3 bg-secondary/50">
                                <div className="flex justify-end mb-2 gap-3">
                                  <button
                                    onClick={() => startEditRow(idx)}
                                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                                  >
                                    <Pencil className="w-3 h-3" /> Edit
                                  </button>
                                  <button
                                    onClick={() => copyToClipboard(JSON.stringify(row, null, 2))}
                                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                                  >
                                    <Copy className="w-3 h-3" /> Copy JSON
                                  </button>
                                </div>
                                <pre className="text-xs bg-background p-3 rounded-lg overflow-x-auto font-mono">
                                  {JSON.stringify(row, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* SQL Tab */}
          <TabsContent value="sql" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary" /> SQL Query Runner
                </CardTitle>
                <CardDescription className="text-xs">
                  Run raw SQL queries against the database
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <textarea
                    value={sqlQuery}
                    onChange={(e) => setSqlQuery(e.target.value)}
                    className="w-full h-40 bg-secondary text-foreground font-mono text-xs p-4 rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="SELECT * FROM app_settings LIMIT 10;"
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        runSql();
                      }
                    }}
                  />
                  <span className="absolute bottom-2 right-3 text-[9px] text-muted-foreground">Ctrl+Enter to run</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button onClick={runSql} disabled={loading} size="sm" className="gap-2">
                    <Play className="w-4 h-4" /> {loading ? 'Running...' : 'Run Query'}
                  </Button>
                  <Button onClick={() => setSqlQuery('')} variant="ghost" size="sm">
                    Clear
                  </Button>
                  {sqlResult && (
                    <Button onClick={() => exportData(sqlResult, 'sql_result')} variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" /> Export Result
                    </Button>
                  )}
                </div>

                {/* Quick queries */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'All Tables', q: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name" },
                    { label: 'Orders Count', q: "SELECT status, count(*) as total FROM orders GROUP BY status" },
                    { label: 'Menu Items', q: "SELECT item_id, name_en, price, cat FROM menu_items ORDER BY sort_order LIMIT 20" },
                    { label: 'Users & Roles', q: "SELECT p.name, ur.role FROM profiles p LEFT JOIN user_roles ur ON p.id = ur.user_id" },
                    { label: 'Settings Keys', q: "SELECT key, updated_at FROM app_settings ORDER BY updated_at DESC" },
                  ].map(q => (
                    <button
                      key={q.label}
                      onClick={() => setSqlQuery(q.q)}
                      className="px-2 py-1 bg-secondary hover:bg-accent border border-border rounded-md text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>

                {/* SQL History */}
                {sqlHistory.length > 0 && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground flex items-center gap-1 hover:text-foreground">
                      <History className="w-3 h-3" /> Query History ({sqlHistory.length})
                    </summary>
                    <div className="mt-2 space-y-1 max-h-[150px] overflow-y-auto">
                      {sqlHistory.map((q, i) => (
                        <button
                          key={i}
                          onClick={() => setSqlQuery(q)}
                          className="w-full text-left px-2 py-1.5 rounded bg-secondary/50 hover:bg-accent font-mono text-[10px] text-foreground/80 truncate"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </details>
                )}

                {/* Error */}
                {sqlError && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-destructive text-xs font-mono">
                    <div className="flex items-center gap-2 font-semibold mb-1">
                      <XCircle className="w-4 h-4" /> Error
                    </div>
                    {sqlError}
                  </div>
                )}

                {/* Results */}
                {sqlResult && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      {sqlResult.length} row{sqlResult.length !== 1 ? 's' : ''} returned
                    </div>
                    {sqlResult.length > 0 ? (
                      <div className="overflow-auto max-h-[400px] rounded-lg border border-border">
                        <table className="w-full border-collapse text-xs">
                          <thead>
                            <tr>
                              {Object.keys(sqlResult[0]).map(key => (
                                <th key={key} className="bg-secondary text-muted-foreground text-[10px] uppercase tracking-wider p-2 text-left font-semibold border-b border-border sticky top-0">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sqlResult.map((row, idx) => (
                              <tr key={idx} className="border-b border-border/50 hover:bg-accent/30">
                                {Object.values(row).map((val, ci) => (
                                  <td key={ci} className="p-2 font-mono text-foreground max-w-[300px] truncate">
                                    {val === null ? <span className="text-muted-foreground italic">null</span> : 
                                     typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground py-4 text-sm">
                        Query executed successfully — no rows returned
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Payments & API Configuration
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure payment methods and API keys
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminPayments />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Storage Tab */}
          <TabsContent value="storage" className="mt-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-primary" /> Storage Configuration
                </CardTitle>
                <CardDescription className="text-xs">
                  Configure where images are stored (Lovable Cloud or Cloudflare R2)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StorageSettings lang="en" />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 mt-4">
            <div className="flex items-center gap-3">
              <Button onClick={fetchAppSettings} disabled={loading} variant="outline" size="sm">
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Load Settings
              </Button>
              <Button onClick={() => exportData(appSettings, 'app_settings')} variant="outline" size="sm" disabled={appSettings.length === 0}>
                <Download className="w-4 h-4 mr-2" /> Export All Settings
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appSettings.map((setting, idx) => (
                <Card key={idx}>
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Key className="w-4 h-4 text-primary" />
                      {setting.key}
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      Updated: {new Date(setting.updated_at).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-secondary p-3 rounded-lg overflow-x-auto font-mono max-h-[200px]">
                      {JSON.stringify(setting.value, null, 2)}
                    </pre>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(setting.value, null, 2))}
                      className="text-xs text-primary flex items-center gap-1 hover:underline mt-2"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </CardContent>
                </Card>
              ))}
              {appSettings.length === 0 && (
                <div className="col-span-2 text-center text-muted-foreground py-10">
                  Click "Load Settings" to view app settings
                </div>
              )}
            </div>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="mt-4">
            <Card>
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4" /> Activity Log
                </CardTitle>
                <Button onClick={() => setLogs([])} variant="ghost" size="sm">
                  Clear
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-secondary rounded-lg p-4 max-h-[500px] overflow-y-auto font-mono text-xs space-y-1">
                  {logs.length === 0 ? (
                    <p className="text-muted-foreground">No activity logged yet</p>
                  ) : (
                    logs.map((log, idx) => (
                      <div key={idx} className="text-foreground/80">{log}</div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4 mt-4">
           {/* === Migration Section === */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-primary" /> Data Migration / Transfer
                </CardTitle>
                <CardDescription className="text-xs">
                  Export all data to migrate to another project, or import data from a backup
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Export Full Backup */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <Download className="w-3.5 h-3.5 text-success" /> Export Full Backup
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    Downloads all tables with their data as a single JSON file. Use this to migrate to another database.
                  </p>
                  <Button 
                    onClick={async () => {
                      setIsMigrating(true);
                      addLog('📦 Creating full backup...');
                      const tableNames = ['app_settings', 'menu_categories', 'menu_items', 'orders', 'profiles', 'user_roles'];
                      const backup: Record<string, any> = { _meta: { exported_at: new Date().toISOString(), source: 'lovable-cloud', tables: tableNames } };
                      const statuses: typeof migrationStatus = [];
                      
                      for (const name of tableNames) {
                        const { data, error } = await supabase.from(name as any).select('*');
                        if (error) {
                          statuses.push({ table: name, status: 'error', count: 0 });
                          addLog(`❌ Failed to export ${name}: ${error.message}`);
                        } else {
                          backup[name] = data;
                          statuses.push({ table: name, status: 'ok', count: data?.length || 0 });
                          addLog(`✅ Exported ${name}: ${data?.length} rows`);
                        }
                      }

                      setMigrationStatus(statuses);
                      
                      const json = JSON.stringify(backup, null, 2);
                      const blob = new Blob([json], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `full_backup_${new Date().toISOString().split('T')[0]}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                      addLog('📥 Full backup downloaded');
                      toast.success('Full backup created!');
                      setIsMigrating(false);
                    }}
                    disabled={isMigrating}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    {isMigrating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                    Export All Tables
                  </Button>
                </div>

                {/* Migration Status */}
                {migrationStatus.length > 0 && (
                  <div className="bg-secondary rounded-lg p-3 space-y-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Export Results</span>
                    {migrationStatus.map(s => (
                      <div key={s.table} className="flex items-center justify-between text-xs">
                        <span className="font-mono text-foreground">{s.table}</span>
                        <span className={`flex items-center gap-1 ${s.status === 'ok' ? 'text-success' : 'text-destructive'}`}>
                          {s.status === 'ok' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {s.count} rows
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-border pt-4" />

                {/* Import Data */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5 text-primary" /> Import Data
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    Paste a backup JSON or upload a file to import data into the current database. 
                    <span className="text-warning font-semibold"> ⚠️ This will add/overwrite data!</span>
                  </p>
                  
                  {/* File Upload */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.json';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          const text = await file.text();
                          setImportJson(text);
                          addLog(`📂 Loaded file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
                          toast.success('File loaded — review and click Import');
                        };
                        input.click();
                      }}
                    >
                      <Upload className="w-4 h-4 mr-2" /> Upload JSON File
                    </Button>
                  </div>

                  <textarea
                    value={importJson}
                    onChange={(e) => setImportJson(e.target.value)}
                    className="w-full h-40 bg-secondary text-foreground font-mono text-xs p-3 rounded-lg border border-border resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder='Paste backup JSON here or upload a file above...'
                  />
                  
                  <Button 
                    onClick={async () => {
                      if (!importJson.trim()) { toast.error('No data to import'); return; }
                      if (!confirm('⚠️ This will insert/overwrite data in the current database. Are you sure?')) return;
                      
                      setIsMigrating(true);
                      addLog('📥 Starting data import...');
                      
                      try {
                        const backup = JSON.parse(importJson);
                        const tableNames = ['app_settings', 'menu_categories', 'menu_items', 'orders', 'profiles', 'user_roles'];
                        const statuses: typeof migrationStatus = [];

                        for (const name of tableNames) {
                          if (!backup[name] || !Array.isArray(backup[name]) || backup[name].length === 0) {
                            statuses.push({ table: name, status: 'skipped', count: 0 });
                            continue;
                          }

                          const rows = backup[name];
                          const { error } = await supabase.from(name as any).upsert(rows, { onConflict: 'id' });
                          
                          if (error) {
                            statuses.push({ table: name, status: 'error', count: 0 });
                            addLog(`❌ Import ${name} failed: ${error.message}`);
                          } else {
                            statuses.push({ table: name, status: 'ok', count: rows.length });
                            addLog(`✅ Imported ${rows.length} rows into ${name}`);
                          }
                        }

                        setMigrationStatus(statuses);
                        toast.success('Import completed!');
                      } catch (err) {
                        toast.error('Invalid JSON format');
                        addLog(`❌ Import error: ${String(err)}`);
                      }
                      setIsMigrating(false);
                    }}
                    disabled={isMigrating || !importJson.trim()}
                    variant="default"
                    size="sm"
                    className="w-full"
                  >
                    {isMigrating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Import Data
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* === Other Tools === */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-destructive" /> Clear Local Storage
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Remove all PLC-related localStorage data
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={clearLocalStorage} variant="destructive" size="sm" className="w-full">
                    Clear localStorage
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" /> System Info
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Current database connection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform:</span>
                    <span className="text-primary font-semibold">Lovable Cloud</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Environment:</span>
                    <span className="text-success">Production</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tables:</span>
                    <span>6 (app_settings, menu_categories, menu_items, orders, profiles, user_roles)</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-primary" /> Clear Table Data
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Delete all rows from a specific table
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {['orders', 'menu_items', 'menu_categories', 'app_settings'].map(tbl => (
                    <Button
                      key={tbl}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs justify-start"
                      onClick={async () => {
                        if (!confirm(`⚠️ Delete ALL rows from ${tbl}?`)) return;
                        const { error } = await supabase.from(tbl as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
                        if (error) {
                          toast.error(error.message);
                          addLog(`❌ Clear ${tbl} failed: ${error.message}`);
                        } else {
                          toast.success(`${tbl} cleared`);
                          addLog(`🗑️ Cleared all rows from ${tbl}`);
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3 mr-2 text-destructive" /> {tbl}
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DevPanel;
