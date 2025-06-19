import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Download,
  ArrowLeft,
  FileText,
  Calendar,
  Search,
  Tag
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import TagManager from "@/components/TagManager";
import { useNoteTags } from "@/hooks/useNoteTags";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface NoteWithTags extends Note {
  tags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

const Notes = () => {
  const [notes, setNotes] = useState<NoteWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    fetchNotes();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/");
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    setCurrentUser(profile);
  };

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select(`
          *,
          note_tags (
            tags (
              id,
              name,
              color
            )
          )
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include tags properly
      const notesWithTags = data?.map(note => ({
        ...note,
        tags: note.note_tags?.map(nt => nt.tags).filter(Boolean) || []
      })) || [];
      
      setNotes(notesWithTags);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch notes.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: noteData, error: noteError } = await supabase
        .from('notes')
        .insert({
          title: newNoteTitle,
          content: newNoteContent,
          user_id: session.user.id
        })
        .select()
        .single();

      if (noteError) throw noteError;

      // Add tags if any are selected
      if (selectedTagIds.length > 0) {
        const noteTagsToInsert = selectedTagIds.map(tagId => ({
          note_id: noteData.id,
          tag_id: tagId
        }));

        const { error: tagsError } = await supabase
          .from('note_tags')
          .insert(noteTagsToInsert);

        if (tagsError) throw tagsError;
      }

      toast({
        title: "Note Created",
        description: "Your note has been created successfully.",
      });

      setIsCreateDialogOpen(false);
      setNewNoteTitle("");
      setNewNoteContent("");
      setSelectedTagIds([]);
      fetchNotes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create note.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNote) return;
    setLoading(true);

    try {
      const { error: noteError } = await supabase
        .from('notes')
        .update({
          title: newNoteTitle,
          content: newNoteContent,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingNote.id);

      if (noteError) throw noteError;

      // Update tags
      await supabase
        .from('note_tags')
        .delete()
        .eq('note_id', editingNote.id);

      if (selectedTagIds.length > 0) {
        const noteTagsToInsert = selectedTagIds.map(tagId => ({
          note_id: editingNote.id,
          tag_id: tagId
        }));

        const { error: tagsError } = await supabase
          .from('note_tags')
          .insert(noteTagsToInsert);

        if (tagsError) throw tagsError;
      }

      toast({
        title: "Note Updated",
        description: "Your note has been updated successfully.",
      });

      setEditingNote(null);
      setNewNoteTitle("");
      setNewNoteContent("");
      setSelectedTagIds([]);
      fetchNotes();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update note.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "Note Deleted",
        description: "Note has been deleted successfully.",
      });

      fetchNotes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete note.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadNote = (note: Note) => {
    const content = `Title: ${note.title}\n\nContent:\n${note.content}\n\nCreated: ${new Date(note.created_at).toLocaleString()}\nLast Updated: ${new Date(note.updated_at).toLocaleString()}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Your note is being downloaded.",
    });
  };

  const handleDownloadAllNotes = () => {
    const allNotesContent = notes.map(note => 
      `${'='.repeat(50)}\nTitle: ${note.title}\nCreated: ${new Date(note.created_at).toLocaleString()}\nLast Updated: ${new Date(note.updated_at).toLocaleString()}\n${'='.repeat(50)}\n\n${note.content}\n\n`
    ).join('\n');

    const blob = new Blob([allNotesContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `all_notes_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "All your notes are being downloaded.",
    });
  };

  const openEditDialog = (note: NoteWithTags) => {
    setEditingNote(note);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
    setSelectedTagIds(note.tags?.map(tag => tag.id) || []);
  };

  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags?.some(tag => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading && !currentUser) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold gradient-text">My Notes</h1>
          </div>
          <div className="flex items-center space-x-2">
            {notes.length > 0 && (
              <Button variant="outline" onClick={handleDownloadAllNotes}>
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            )}
            <Badge className="bg-blue-600">
              {notes.length} {notes.length === 1 ? 'Note' : 'Notes'}
            </Badge>
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto">
        {/* Search and Create */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes and tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-white/20"
            />
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Note</DialogTitle>
                <DialogDescription>
                  Add a new note to your collection.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateNote} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    rows={10}
                    placeholder="Write your note content here..."
                  />
                </div>
                <TagManager
                  selectedTags={selectedTagIds}
                  onTagsChange={setSelectedTagIds}
                  itemType="note"
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating..." : "Create Note"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Note Dialog */}
        <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
              <DialogDescription>
                Update your note content and tags.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateNote} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editTitle">Title</Label>
                <Input
                  id="editTitle"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editContent">Content</Label>
                <Textarea
                  id="editContent"
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={10}
                  placeholder="Write your note content here..."
                />
              </div>
              <TagManager
                selectedTags={selectedTagIds}
                onTagsChange={setSelectedTagIds}
                itemType="note"
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Updating..." : "Update Note"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Notes List */}
        <div className="space-y-4">
          {filteredNotes.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm ? "No notes found" : "No notes yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "Try adjusting your search terms." 
                    : "Create your first note to get started."
                  }
                </p>
                {!searchTerm && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Note
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredNotes.map((note) => (
              <Card key={note.id} className="glass-card hover:glow-effect transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{note.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Created: {new Date(note.created_at).toLocaleDateString()}
                        </span>
                        {note.updated_at !== note.created_at && (
                          <span>
                            Updated: {new Date(note.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {note.tags.map(tag => (
                            <Badge
                              key={tag.id}
                              style={{ backgroundColor: tag.color }}
                              className="text-white text-xs"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-muted-foreground line-clamp-3">
                        {note.content || "No content"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => openEditDialog(note)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownloadNote(note)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteNote(note.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;
