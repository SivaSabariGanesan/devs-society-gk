import React from 'react'

interface AdminUsersTableProps {
  users: any[]
}

const AdminUsersTable: React.FC<AdminUsersTableProps> = ({ users }) => {
  return (
    <div className="bg-white/5 border border-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">Users</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left border border-gray-700">
          <thead>
            <tr className="bg-gray-800">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr key={user.id || idx} className="border-t border-gray-700">
                <td className="p-2">{user.fullName || user.name}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">
                  {user.role === 'core-member' ? 'Core Member' :
                   user.role === 'board-member' ? 'Board Member' :
                   user.role === 'special-member' ? 'Special Member' :
                   user.role === 'other' ? 'Other' : user.role}
                </td>
                <td className="p-2">
                  {user.actions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminUsersTable 