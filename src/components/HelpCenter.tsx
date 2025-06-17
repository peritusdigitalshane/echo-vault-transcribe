
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { 
  HelpCircle, 
  MessageCircle, 
  Book, 
  Video, 
  Mail, 
  Phone,
  Search,
  Mic,
  Upload,
  Settings,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const HelpCenter = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "Our support team will get back to you within 24 hours.",
    });
  };

  const faqs = [
    {
      question: "How do I start recording a meeting?",
      answer: "Click the large microphone button on your dashboard. Make sure your browser has microphone permissions enabled. The button will turn red and pulse when recording is active.",
      category: "Recording"
    },
    {
      question: "What audio formats are supported for upload?",
      answer: "VoiceFlow supports MP3, WAV, M4A, and most common audio formats. Files should be under 100MB for optimal processing speed.",
      category: "Upload"
    },
    {
      question: "How accurate is the AI transcription?",
      answer: "Our AI powered by OpenAI Whisper achieves 95%+ accuracy for clear audio. Accuracy may vary based on audio quality, background noise, and speaker clarity.",
      category: "Transcription"
    },
    {
      question: "Can I edit transcripts after they're generated?",
      answer: "Yes! Click the edit icon next to any transcript to make corrections. All changes are saved automatically to your account.",
      category: "Editing"
    },
    {
      question: "How is my data protected?",
      answer: "All audio files and transcripts are encrypted both in transit and at rest. We use enterprise-grade security and never share your data with third parties.",
      category: "Security"
    },
    {
      question: "Can I export my transcripts?",
      answer: "Absolutely! You can download transcripts as PDF, Word documents, or plain text files. Use the download button next to each transcript.",
      category: "Export"
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const quickActions = [
    {
      icon: Mic,
      title: "Recording Guide",
      description: "Learn how to get the best recording quality",
      badge: "Popular"
    },
    {
      icon: Upload,
      title: "File Upload",
      description: "Supported formats and upload tips",
      badge: "New"
    },
    {
      icon: Settings,
      title: "Account Settings",
      description: "Manage your profile and preferences",
      badge: null
    },
    {
      icon: Download,
      title: "Export Options",
      description: "Download transcripts in various formats",
      badge: null
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="gradient-text">Help Center</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get the most out of VoiceFlow with our comprehensive guides and support resources
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search help articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 border-white/20"
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions */}
          <div className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Book className="h-5 w-5 mr-2 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                    <action.icon className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-sm">{action.title}</h4>
                        {action.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Contact Support */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                  Contact Support
                </CardTitle>
                <CardDescription>
                  Can't find what you're looking for?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject" 
                      placeholder="How can we help?"
                      className="bg-background/50 border-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      placeholder="Describe your issue or question..."
                      className="bg-background/50 border-white/20 min-h-[100px]"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
                
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>support@voiceflow.ai</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>+1 (555) 123-4567</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - FAQs */}
          <div className="lg:col-span-2">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  {filteredFaqs.length} articles found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  {filteredFaqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border border-white/10 rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center space-x-3 text-left">
                          <Badge variant="outline" className="text-xs">
                            {faq.category}
                          </Badge>
                          <span>{faq.question}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Video className="h-5 w-5 mr-2 text-primary" />
                Video Tutorials
              </CardTitle>
              <CardDescription>
                Watch step-by-step guides
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                  <h4 className="font-medium text-sm mb-1">Getting Started with VoiceFlow</h4>
                  <p className="text-xs text-muted-foreground">5:32 • Introduction</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                  <h4 className="font-medium text-sm mb-1">Recording Best Practices</h4>
                  <p className="text-xs text-muted-foreground">3:45 • Tips & Tricks</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                  <h4 className="font-medium text-sm mb-1">Managing Your Transcripts</h4>
                  <p className="text-xs text-muted-foreground">4:12 • Organization</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Book className="h-5 w-5 mr-2 text-primary" />
                User Guide
              </CardTitle>
              <CardDescription>
                Comprehensive documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                  <h4 className="font-medium text-sm mb-1">Account Setup & Configuration</h4>
                  <p className="text-xs text-muted-foreground">Complete setup guide</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                  <h4 className="font-medium text-sm mb-1">Audio Quality Guidelines</h4>
                  <p className="text-xs text-muted-foreground">Optimize your recordings</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                  <h4 className="font-medium text-sm mb-1">Troubleshooting Common Issues</h4>
                  <p className="text-xs text-muted-foreground">Solve problems quickly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;
