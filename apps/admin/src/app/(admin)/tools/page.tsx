'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode, Wrench } from 'lucide-react';

export default function ToolsPage() {
  const tools = [
    {
      title: 'QR Code Generator',
      description: 'Generate QR codes for member detail submissions and other purposes',
      href: '/tools/qr-code',
      icon: QrCode,
      color: 'from-blue-500 to-purple-600'
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl">
          <Wrench className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tools</h1>
          <p className="text-gray-600 mt-1">Helpful utilities and generators for church management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link key={tool.href} href={tool.href}>
              <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-blue-300 h-full">
                <CardHeader>
                  <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${tool.color} rounded-xl mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                  <CardDescription className="text-base">{tool.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

