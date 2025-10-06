import React from "react";
import ChatSidebar from "./ChatSidebar";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gray-900 text-gray-200 font-inter">
      <ChatSidebar />
      <main className="flex-grow p-6 flex flex-col h-screen">
        {children}
      </main>
    </div>
  );
}
