'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Download, QrCode, Copy, Check, Printer, ExternalLink } from 'lucide-react';

// Dynamic import to avoid SSR issues
let QRCodeStyling: any = null;

export default function QRCodeGeneratorPage() {
  const [url, setUrl] = useState('https://docmchurch.org/submit-details');
  const [size, setSize] = useState('300');
  const [copied, setCopied] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const qrCodeInstance = useRef<any>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Dynamically import QRCodeStyling only on client side
    import('qr-code-styling').then((module) => {
      QRCodeStyling = module.default;
      
      // Initialize QR Code
      if (QRCodeStyling && qrCodeRef.current) {
        qrCodeInstance.current = new QRCodeStyling({
        width: parseInt(size),
        height: parseInt(size),
        data: url,
        margin: 10,
        qrOptions: {
          typeNumber: 0,
          mode: 'Byte',
          errorCorrectionLevel: 'H'
        },
        imageOptions: {
          hideBackgroundDots: true,
          imageSize: 0.4,
          margin: 8
        },
        dotsOptions: {
          type: 'rounded',
          color: '#1a1a1a',
          gradient: {
            type: 'linear',
            rotation: 0,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#8b5cf6' }
            ]
          }
        },
        backgroundOptions: {
          color: '#ffffff'
        },
        cornersSquareOptions: {
          type: 'extra-rounded',
          color: '#1a1a1a'
        },
        cornersDotOptions: {
          type: 'dot',
          color: '#3b82f6'
        }
      });

        if (qrCodeRef.current) {
          qrCodeRef.current.innerHTML = '';
          qrCodeInstance.current.append(qrCodeRef.current);
        }
      }
    });
  }, []);

  useEffect(() => {
    // Update QR code when URL or size changes
    if (qrCodeInstance.current) {
      qrCodeInstance.current.update({
        data: url,
        width: parseInt(size),
        height: parseInt(size)
      });
    }
  }, [url, size]);

  const handleDownloadPNG = () => {
    if (qrCodeInstance.current) {
      qrCodeInstance.current.download({
        name: 'docm-church-submit-details-qr',
        extension: 'png'
      });
      toast({
        title: 'Success!',
        description: 'QR code downloaded as PNG',
      });
    }
  };

  const handleDownloadSVG = () => {
    if (qrCodeInstance.current) {
      qrCodeInstance.current.download({
        name: 'docm-church-submit-details-qr',
        extension: 'svg'
      });
      toast({
        title: 'Success!',
        description: 'QR code downloaded as SVG (scalable for printing)',
      });
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({
        title: 'Copied!',
        description: 'URL copied to clipboard',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to copy URL',
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (printWindow && qrCodeRef.current) {
      const qrCodeHtml = qrCodeRef.current.innerHTML;
      printWindow.document.write(`
        <html>
          <head>
            <title>DOCM Church - Member Details QR Code</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px;
                text-align: center;
              }
              h1 {
                color: #1a1a1a;
                margin-bottom: 20px;
                font-size: 28px;
              }
              .qr-container {
                margin: 30px 0;
                border: 2px solid #e5e7eb;
                padding: 20px;
                border-radius: 12px;
                display: inline-block;
              }
              p {
                color: #6b7280;
                font-size: 16px;
                margin-top: 20px;
              }
              .url {
                color: #3b82f6;
                font-weight: bold;
                margin-top: 10px;
              }
            </style>
          </head>
          <body>
            <h1>DOCM Church</h1>
            <h2>Submit Your Member Details</h2>
            <div class="qr-container">
              ${qrCodeHtml}
            </div>
            <p>Scan this QR code to submit your contact information</p>
            <p class="url">${url}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
          <QrCode className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">QR Code Generator</h1>
          <p className="text-gray-600 mt-1">Generate a QR code for member detail submissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code Settings</CardTitle>
            <CardDescription>Customize your QR code appearance and destination</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">Destination URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://docmchurch.org/submit-details"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  className="flex-shrink-0"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-sm text-gray-500">This is where users will be directed when they scan the QR code</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">QR Code Size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger id="size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="200">Small (200x200px)</SelectItem>
                  <SelectItem value="300">Medium (300x300px)</SelectItem>
                  <SelectItem value="400">Large (400x400px)</SelectItem>
                  <SelectItem value="600">Extra Large (600x600px)</SelectItem>
                  <SelectItem value="1000">Print Quality (1000x1000px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Button onClick={handleDownloadPNG} className="w-full" size="lg" disabled={!isClient}>
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </Button>
              
              <Button onClick={handleDownloadSVG} variant="outline" className="w-full" size="lg" disabled={!isClient}>
                <Download className="w-4 h-4 mr-2" />
                Download SVG (Scalable)
              </Button>
              
              <Button onClick={handlePrint} variant="outline" className="w-full" size="lg" disabled={!isClient}>
                <Printer className="w-4 h-4 mr-2" />
                Print QR Code
              </Button>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-900">💡 Pro Tip:</p>
              <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                <li>Use PNG for digital displays (bulletins, screens)</li>
                <li>Use SVG for printing (posters, flyers) - stays sharp at any size</li>
                <li>Test the QR code before printing large quantities</li>
                <li>Ensure good contrast between QR code and background</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code Preview</CardTitle>
            <CardDescription>Scan this code to test it on your phone</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-gray-200">
                {!isClient ? (
                  <div className="flex items-center justify-center w-[300px] h-[300px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-sm text-gray-600">Loading QR Code...</p>
                    </div>
                  </div>
                ) : (
                  <div ref={qrCodeRef} className="flex items-center justify-center min-h-[300px]"></div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(url, '_blank')}
                className="gap-2"
                disabled={!isClient}
              >
                <ExternalLink className="w-4 h-4" />
                Test URL in Browser
              </Button>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6 w-full">
                <h4 className="font-semibold text-green-900 mb-2">✅ How to Use This QR Code:</h4>
                <ol className="text-sm text-green-800 space-y-2 ml-4 list-decimal">
                  <li>Download the QR code (PNG or SVG)</li>
                  <li>Add it to your bulletin, poster, or presentation</li>
                  <li>Members scan with their phone camera</li>
                  <li>They fill out the form on their phone</li>
                  <li>You review and approve in <strong>Pending Contacts</strong></li>
                  <li>Approved submissions appear in <strong>Contacts</strong></li>
                </ol>
              </div>

              <div className="text-center text-sm text-gray-600 w-full">
                <p className="font-medium mb-2">Where to place this QR code:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-gray-50 p-3 rounded-lg">📄 Church Bulletins</div>
                  <div className="bg-gray-50 p-3 rounded-lg">🪧 Welcome Desk</div>
                  <div className="bg-gray-50 p-3 rounded-lg">📺 Display Screens</div>
                  <div className="bg-gray-50 p-3 rounded-lg">📋 Event Signage</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900">📊 Submission Stats</CardTitle>
          <CardDescription className="text-purple-700">
            Track submissions from this QR code in the <strong>Pending Contacts</strong> page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.location.href = '/people/pending-contacts'}
            className="bg-purple-600 hover:bg-purple-700"
          >
            View Pending Submissions →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

