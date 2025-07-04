import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Mail, Phone, MapPin, Globe, Linkedin, Twitter, Instagram, Github, Calendar, User, Building } from "lucide-react";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import { usePublicPortfolio, useSubmitInquiry } from "@/hooks/use-portfolios";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function PublicPortfolioPage() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [isInquiryDialogOpen, setIsInquiryDialogOpen] = useState(false);
  
  const { data: portfolio, isLoading, error } = usePublicPortfolio(slug || "");
  const submitInquiryMutation = useSubmitInquiry();

  const [inquiryForm, setInquiryForm] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: "",
    phone: "",
    budget: "",
    timeline: "",
    projectType: "",
  });

  const resetInquiryForm = () => {
    setInquiryForm({
      name: "",
      email: "",
      company: "",
      subject: "",
      message: "",
      phone: "",
      budget: "",
      timeline: "",
      projectType: "",
    });
  };

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inquiryForm.name.trim() || !inquiryForm.email.trim() || !inquiryForm.message.trim()) {
      toast({
        title: "Error",
        description: "Name, email, and message are required",
        variant: "destructive",
      });
      return;
    }

    try {
      await submitInquiryMutation.mutateAsync({
        slug: slug || "",
        ...inquiryForm,
      });
      
      toast({
        title: "Success",
        description: "Your inquiry has been sent successfully!",
      });
      
      setIsInquiryDialogOpen(false);
      resetInquiryForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send inquiry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'linkedin': return <Linkedin className="h-5 w-5" />;
      case 'twitter': return <Twitter className="h-5 w-5" />;
      case 'instagram': return <Instagram className="h-5 w-5" />;
      case 'github': return <Github className="h-5 w-5" />;
      default: return <Globe className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-8">
            <div className="text-center space-y-4">
              <div className="h-12 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-6 bg-gray-200 rounded w-1/3 mx-auto"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Portfolio not found</h1>
          <p className="text-gray-600">The portfolio you're looking for doesn't exist or is not public.</p>
        </div>
      </div>
    );
  }

  const featuredProjects = portfolio.projects.filter(p => p.isFeatured);
  const otherProjects = portfolio.projects.filter(p => !p.isFeatured);

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: portfolio.theme === 'minimal' ? '#fafafa' : '#ffffff',
        color: portfolio.theme === 'creative' ? '#1a1a1a' : '#374151'
      }}
    >
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: portfolio.primaryColor }}>
                {portfolio.title}
              </h1>
              {portfolio.tagline && (
                <p className="text-gray-600 mt-1">{portfolio.tagline}</p>
              )}
            </div>
            
            {portfolio.settings?.allowMessages && (
              <Dialog open={isInquiryDialogOpen} onOpenChange={setIsInquiryDialogOpen}>
                <DialogTrigger asChild>
                  <Button style={{ backgroundColor: portfolio.primaryColor }}>
                    <Mail className="h-4 w-4 mr-2" />
                    Get in Touch
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Send an Inquiry</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmitInquiry} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          value={inquiryForm.name}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={inquiryForm.email}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          value={inquiryForm.company}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, company: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="budget">Budget</Label>
                        <Input
                          id="budget"
                          value={inquiryForm.budget}
                          onChange={(e) => setInquiryForm({ ...inquiryForm, budget: e.target.value })}
                          placeholder="$5,000 - $10,000"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        value={inquiryForm.subject}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, subject: e.target.value })}
                        placeholder="Project inquiry"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={inquiryForm.message}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                        rows={4}
                        placeholder="Tell me about your project..."
                        required
                      />
                    </div>

                    <DialogFooter>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsInquiryDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={submitInquiryMutation.isPending}
                        style={{ backgroundColor: portfolio.primaryColor }}
                      >
                        {submitInquiryMutation.isPending ? "Sending..." : "Send Inquiry"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* About Section */}
        {portfolio.description && (
          <section className="mb-16">
            <div className="prose prose-lg max-w-none">
              <MarkdownPreview source={portfolio.description} />
            </div>
          </section>
        )}

        {/* Designer Info */}
        <section className="mb-16 flex items-center gap-8">
          {portfolio.designer.photoUrl && (
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0">
              <img 
                src={portfolio.designer.photoUrl} 
                alt={portfolio.designer.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold mb-2">{portfolio.designer.name}</h2>
            <p className="text-lg text-gray-600 mb-2">
              {portfolio.designer.level} {portfolio.designer.title}
            </p>
            {portfolio.designer.location && (
              <p className="text-gray-500 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {portfolio.designer.location}
              </p>
            )}
          </div>
        </section>

        {/* Featured Projects */}
        {featuredProjects.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8" style={{ color: portfolio.primaryColor }}>
              Featured Work
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {featuredProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {project.coverImageUrl && (
                    <div className="aspect-video bg-gray-100">
                      <img 
                        src={project.coverImageUrl} 
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold">{project.title}</h3>
                      {project.category && (
                        <Badge variant="outline">{project.category}</Badge>
                      )}
                    </div>
                    
                    {project.description && (
                      <p className="text-gray-600 mb-4">{project.description}</p>
                    )}
                    
                    <div className="space-y-3">
                      {(project.clientName || project.role || project.duration) && (
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          {project.clientName && (
                            <span className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              {project.clientName}
                            </span>
                          )}
                          {project.role && (
                            <span className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {project.role}
                            </span>
                          )}
                          {project.duration && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {project.duration}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {project.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      {project.content && (
                        <div className="prose prose-sm max-w-none mt-4">
                          <MarkdownPreview source={project.content} />
                        </div>
                      )}
                      
                      {project.projectUrl && (
                        <div className="pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(project.projectUrl!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Project
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Other Projects */}
        {otherProjects.length > 0 && (
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8" style={{ color: portfolio.primaryColor }}>
              {featuredProjects.length > 0 ? 'More Work' : 'Portfolio'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherProjects.map((project) => (
                <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  {project.coverImageUrl && (
                    <div className="aspect-video bg-gray-100">
                      <img 
                        src={project.coverImageUrl} 
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">{project.title}</h3>
                    {project.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                    )}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {project.tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {project.projectUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(project.projectUrl!, '_blank')}
                        className="w-full"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        View
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Contact Section */}
        {portfolio.settings?.showContact && (
          <section className="mb-16 text-center">
            <h2 className="text-3xl font-bold mb-8" style={{ color: portfolio.primaryColor }}>
              Let's Work Together
            </h2>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {portfolio.contactInfo?.email && (
                <a 
                  href={`mailto:${portfolio.contactInfo.email}`}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  <Mail className="h-5 w-5" />
                  {portfolio.contactInfo.email}
                </a>
              )}
              
              {portfolio.contactInfo?.phone && (
                <a 
                  href={`tel:${portfolio.contactInfo.phone}`}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  <Phone className="h-5 w-5" />
                  {portfolio.contactInfo.phone}
                </a>
              )}
              
              {portfolio.contactInfo?.location && (
                <div className="flex items-center gap-2 px-4 py-2 border rounded-lg">
                  <MapPin className="h-5 w-5" />
                  {portfolio.contactInfo.location}
                </div>
              )}
            </div>

            {portfolio.settings?.showSocialLinks && portfolio.socialLinks && (
              <div className="flex justify-center gap-4">
                {Object.entries(portfolio.socialLinks).map(([platform, url]) => (
                  url && (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {getSocialIcon(platform)}
                    </a>
                  )
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-gray-50 py-8 text-center text-gray-600">
        <p>© {new Date().getFullYear()} {portfolio.designer.name}. All rights reserved.</p>
        <p className="text-sm mt-1">Portfolio powered by Tapestry</p>
      </footer>
    </div>
  );
}