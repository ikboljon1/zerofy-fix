
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import UserList from "./UserList";
import UserDetails from "./UserDetails";
import AddUserModal from "./AddUserModal";
import { User, getUsers } from "@/services/userService";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
    setSelectedUser(updatedUser);
  };

  const handleAddUser = () => {
    setIsAddUserModalOpen(true);
  };

  const handleUserAdded = (user: User) => {
    setUsers((prevUsers) => [...prevUsers, user]);
    setIsAddUserModalOpen(false);
  };

  const handleBackToList = () => {
    setSelectedUser(null);
    // Refresh the user list when returning to list view
    fetchUsers();
  };

  return (
    <div className="grid gap-6">
      {selectedUser ? (
        <UserDetails
          user={selectedUser}
          onBack={handleBackToList}
          onUserUpdated={handleUserUpdated}
        />
      ) : (
        <UserList
          onSelectUser={handleSelectUser}
          onAddUser={handleAddUser}
        />
      )}

      <AddUserModal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        onUserAdded={handleUserAdded}
      />
    </div>
  );
}
