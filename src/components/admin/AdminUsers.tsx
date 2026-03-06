import { useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { UserRole } from '@/types';

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
        <h2 className="text-foreground text-lg font-bold">👥 User Management</h2>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-bold cursor-pointer">+ Add User</button>
      </div>

      {users.map(user => (
        <div key={user.username} className="bg-muted rounded-xl p-4 border border-foreground/5 flex items-center gap-4 mb-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${user.role === 'super' ? 'bg-primary/20 border-2 border-primary text-primary' : 'bg-info/20 border-2 border-info text-info'}`}>
            {user.role === 'super' ? '👑' : '👤'}
          </div>
          <div className="flex-1">
            <div className="text-foreground font-bold">{user.name}</div>
            <div className={`text-xs mt-0.5 ${user.role === 'super' ? 'text-primary' : 'text-info'}`}>
              {user.role === 'super' ? 'Super Admin' : 'Staff'}
            </div>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {user.role === 'super' ? (
                ['Full Access', 'Reports', 'Payments', 'Users', 'Menu'].map(p => (
                  <span key={p} className="px-2 py-0.5 rounded text-[10px] bg-primary/15 text-primary">{p}</span>
                ))
              ) : (
                ['Daily Orders', 'View Menu'].map(p => (
                  <span key={p} className="px-2 py-0.5 rounded text-[10px] bg-info/15 text-info">{p}</span>
                ))
              )}
            </div>
          </div>
          <div className="text-foreground/30 text-xs">{user.username}</div>
          {user.username !== 'admin' && (
            <button onClick={() => removeUser(user.username)} className="px-3 py-1 bg-destructive/20 text-destructive border border-destructive/30 rounded text-[11px] font-bold cursor-pointer">Remove</button>
          )}
        </div>
      ))}

      {showModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-[1000] backdrop-blur-sm">
          <div className="bg-muted border border-primary/30 rounded-2xl p-8 min-w-[420px] animate-modal-in">
            <h3 className="text-primary text-xl font-bold mb-5">👤 Add User</h3>
            {[
              { label: 'USERNAME', value: newUser.username, key: 'username', type: 'text', placeholder: 'username' },
              { label: 'FULL NAME', value: newUser.fullname, key: 'fullname', type: 'text', placeholder: 'Full Name' },
              { label: 'PASSWORD', value: newUser.password, key: 'password', type: 'password', placeholder: '••••••••' },
            ].map(f => (
              <div key={f.key} className="mb-4">
                <label className="text-foreground/60 text-xs tracking-wider block mb-1.5">{f.label}</label>
                <input className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm focus:outline-none focus:border-primary" type={f.type} value={f.value} onChange={e => setNewUser(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
              </div>
            ))}
            <div className="mb-4">
              <label className="text-foreground/60 text-xs tracking-wider block mb-1.5">ROLE</label>
              <select className="w-full p-2.5 bg-secondary border border-foreground/10 rounded-lg text-foreground text-sm" value={newUser.role} onChange={e => setNewUser(p => ({ ...p, role: e.target.value as UserRole }))}>
                <option value="staff">👤 Staff</option>
                <option value="super">👑 Super Admin</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-destructive/20 text-destructive border border-destructive/30 rounded-lg text-sm font-bold cursor-pointer">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-primary text-background rounded-lg text-sm font-bold cursor-pointer">Add User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
