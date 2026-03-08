import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Lock, Database, Table2, RefreshCw, Trash2, Download, 
  Settings, Key, Shield, Eye, EyeOff, Terminal, 
  AlertTriangle, CheckCircle2, XCircle, ChevronDown, ChevronRight,
  FileJson, Copy, Code, Save, Pencil, Plus, X
} from 'lucide-react';
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
          <TabsList className="w-full grid grid-cols-4 h-11">
            <TabsTrigger value="database" className="gap-2 text-xs">
              <Database className="w-4 h-4" /> Database
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 text-xs">
              <Settings className="w-4 h-4" /> Settings
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2 text-xs">
              <Terminal className="w-4 h-4" /> Logs
            </TabsTrigger>
            <TabsTrigger value="tools" className="gap-2 text-xs">
              <Shield className="w-4 h-4" /> Tools
            </TabsTrigger>
          </TabsList>

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
                    <Download className="w-4 h-4 text-primary" /> Backup All Data
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Export all tables as JSON backup
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={async () => {
                      const allData: Record<string, any> = {};
                      for (const t of tables) {
                        const { data } = await supabase.from(t.name as any).select('*');
                        allData[t.name] = data;
                      }
                      exportData([allData], 'full_backup');
                    }} 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    disabled={tables.length === 0}
                  >
                    Create Full Backup
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" /> System Info
                  </CardTitle>
                  <CardDescription className="text-xs">
                    View current system configuration
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Project ID:</span>
                    <span className="font-mono text-foreground">sojigwzhoqk...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Environment:</span>
                    <span className="text-success">Production</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tables:</span>
                    <span>{tables.length}</span>
                  </div>
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
