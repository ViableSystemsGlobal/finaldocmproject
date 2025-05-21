"use client"

import { ContactForm } from "@/components/ContactForm"
import { createContact } from "@/services/contacts"

export default function NewContactPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New Contact</h1>
      <ContactForm onSubmit={createContact} />
    </div>
  )
} 