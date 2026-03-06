import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { UserRole } from '@/types';
import { Users, Plus, Trash2, Shield, User as UserIcon, X } from 'lucide-react';

const AdminUsers = () => {
  const { users, addUser, removeUser } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', fullname: '', password: '', role: 'staff' as UserRole });

  const handleAdd = () => {
    addUser({ username: newUser.username, name: newUser.fullname, password: newUser.password, role: newUser.role });
    setShowModal(false);
    setNewUser({ username: '', fullname: '', password: '', role: 'staff' });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-foreground text-base font-bold flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" /> User Management
        </h2>
        <button onClick={() => setShowModal(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:opacity-90 transition-all">
          <Plus className="w-3.5 h-3.5" /> Add User
        </button>
      </div>

      <div className="space-y-3">
        {users.map(user => (
          <div key={user.username} className="bg-card rounded-xl p-4 border border-border flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${user.role === 'super' ? 'bg-primary/10 text-primary' : 'bg-info/10 text-info'}`}>
              {user.role === 'super' ? <Shield className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <div className="text-foreground font-semibold text-sm">{user.name}</div>
              <div className={`text-xs mt-0.5 ${user.role === 'super' ? 'text-primary' : 'text-info'}`}>
                {user.role === 'super' ? 'Super Admin' : 'Staff'}
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {user.role === 'super' ? (
                  ['Full Access', 'Reports', 'Payments', 'Users', 'Menu'].map(p => (
                    <span key={p} className="px-2 py-0.5 rounded text-[10px] bg-primary/10 text-primary font-medium">{p}</span>
                  ))
                ) : (
                  ['Daily Orders', 'View Menu'].map(p => (
                    <span key={p} className="px-2 py-0.5 rounded text-[10px] bg-info/10 text-info font-medium">{p}</span>
                  ))
                )}
              </div>
            </div>
            <div className="text-muted-foreground text-xs">{user.username}</div>
            {user.username !== 'admin' && (
              <button onClick={() => removeUser(user.username)} className="p-1.5 bg-destructive/10 text-destructive border border-destructive/20 rounded-md cursor-pointer hover:bg-destructive/20 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[1000]">
          <div className="bg-card border border-border rounded-xl p-6 min-w-[420px] animate-modal-in">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-foreground text-base font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Add User
              </h3>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {[
              { label: 'Username', value: newUser.username, key: 'username', type: 'text', placeholder: 'username' },
              { label: 'Full Name', value: newUser.fullname, key: 'fullname', type: 'text', placeholder: 'Full Name' },
              { label: 'Password', value: newUser.password, key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key} className="mb-3">
                <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">{f.label}</label>
                <input className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 transition-colors" type={f.type} value={f.value} onChange={e => setNewUser(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
              </div>
            ))}
            <div className="mb-4">
              <label className="text-muted-foreground text-[10px] tracking-widest uppercase block mb-1.5 font-semibold">Role</label>
              <select className="w-full p-2.5 bg-secondary border border-border rounded-lg text-foreground text-sm" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value as UserRole }))}>
                <option value="staff">Staff</option>
                <option value="super">Super Admin</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-semibold cursor-pointer hover:bg-muted transition-all">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold cursor-pointer hover:opacity-90 transition-all">Add User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
