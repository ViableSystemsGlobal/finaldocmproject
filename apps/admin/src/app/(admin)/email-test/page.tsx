'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Send, Mail, TestTube, Zap, Activity } from 'lucide-react';
import { EMAIL_ACCOUNTS } from '@/lib/emailAccounts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmailTestForm from "./email-test-form";
import EmailQueueTest from "./email-queue-test";

// Define type for queued emails
interface QueuedEmail {
  id: string;
  to_address: string;
  subject: string;
  status: string;
  attempts: number;
  [key: string]: any;
}

export default function EmailTestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-100">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur-sm opacity-75"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-2xl">
                <TestTube className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Email Testing Center
              </h1>
              <p className="text-xl text-slate-600 mt-2">
                Test and diagnose email functionality and queue health
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Send className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-blue-100 text-sm font-medium">Email Testing</p>
                  <p className="text-2xl font-bold">Send Test</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-200" />
                <span className="text-blue-100 text-sm font-medium">Real-time testing</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Mail className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-cyan-100 text-sm font-medium">Queue Diagnostics</p>
                  <p className="text-2xl font-bold">Monitor</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-200" />
                <span className="text-cyan-100 text-sm font-medium">Queue health</span>
              </div>
            </div>
          </div>

          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 p-6 text-white shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-105">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10"></div>
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <TestTube className="h-8 w-8" />
                </div>
                <div className="text-right">
                  <p className="text-teal-100 text-sm font-medium">System Status</p>
                  <p className="text-2xl font-bold">Healthy</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-teal-200" />
                <span className="text-teal-100 text-sm font-medium">All systems go</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-white/70 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <TestTube className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Email Testing Tools</h2>
                <p className="text-slate-300">Test email delivery and monitor queue status</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <Tabs defaultValue="send-test" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-slate-100 rounded-xl">
                <TabsTrigger 
                  value="send-test" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 font-medium"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </TabsTrigger>
                <TabsTrigger 
                  value="queue-diagnostic" 
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-cyan-600 font-medium"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Queue Diagnostics
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="send-test" className="mt-0">
                <EmailTestForm />
              </TabsContent>
              
              <TabsContent value="queue-diagnostic" className="mt-0">
                <EmailQueueTest />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
} 