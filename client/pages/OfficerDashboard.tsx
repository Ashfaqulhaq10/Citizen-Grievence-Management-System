import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LogOut, Filter, MapPin, Calendar, Phone, Mail } from 'lucide-react';
import { useI18n } from '@/i18n';

interface Complaint {
  id: number;
  category: string;
  description: string;
  location_text?: string;
  district?: string;
  city?: string;
  village?: string;
  status: string;
  created_at: string;
  user_email?: string;
  user_name?: string;
  media_url?: string;
  resolution_photo_url?: string;
  lat?: number;
  lng?: number;
}

interface Officer {
  id: number;
  email: string;
  name: string;
  role: string;
  department: string;
}

export default function OfficerDashboard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('officer_token');
    if (!storedToken) {
      navigate('/officer-login');
      setAuthLoading(false);
      return;
    }

    setToken(storedToken);

    fetch('/api/officer/auth/me', {
      headers: { Authorization: `Bearer ${storedToken}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Auth failed: ${res.status}`);
        }
        const contentType = res.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return res.json();
        }
        throw new Error('Invalid response format');
      })
      .then((data) => {
        if (data.officer) {
          setOfficer(data.officer);
        } else {
          localStorage.removeItem('officer_token');
          navigate('/officer-login');
        }
      })
      .catch((err) => {
        console.error('[Officer Dashboard] Auth error:', err);
        localStorage.removeItem('officer_token');
        navigate('/officer-login');
      })
      .finally(() => {
        setAuthLoading(false);
      });
  }, [navigate]);

  const { data, isLoading, error } = useQuery<{ complaints: Complaint[] }>({
    queryKey: ['officer-complaints', token],
    queryFn: async () => {
      if (!token) throw new Error('No token available');
      const res = await fetch('/api/officer/complaints/assigned', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch complaints: ${res.status}`);
      }
      const contentType = res.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return res.json();
      }
      throw new Error('Invalid response format');
    },
    enabled: !!token && !authLoading,
    refetchInterval: 10000,
  });

  const complaints = data?.complaints || [];
  const filtered = statusFilter === 'all'
    ? complaints
    : complaints.filter((c) => c.status === statusFilter);

  const handleStatusChange = async (complaintId: number, newStatus: string) => {
    if (!token) {
      toast.error('No authentication token');
      return;
    }
    setUpdatingId(complaintId);

    try {
      const res = await fetch(`/api/officer/complaints/${complaintId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success('Status updated');
        await qc.invalidateQueries({ queryKey: ['officer-complaints', token] });
      } else {
        let errorMessage = `Failed to update status (${res.status})`;
        try {
          const contentType = res.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const data = await res.json();
            errorMessage = data.error || errorMessage;
          }
        } catch (parseError) {
          // Response body is not JSON, use default error message
        }
        console.error('[Officer Dashboard] Status update failed:', { status: res.status, message: errorMessage });
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('[Officer Dashboard] Status update error:', error);
      toast.error('Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUploadCompletionPhoto = async (complaintId: number, file: File) => {
    if (!token) {
      toast.error('No authentication token');
      return;
    }
    setUploadingId(complaintId);

    try {
      const formData = new FormData();
      formData.set('photo', file);

      const res = await fetch(`/api/officer/complaints/${complaintId}/resolve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status}`);
      }

      const contentType = res.headers.get('content-type');
      let data = {};
      if (contentType?.includes('application/json')) {
        data = await res.json();
      }

      if (data.success || data.resolution_photo_url) {
        toast.success('Completion photo uploaded and marked as completed');

        if (selectedComplaint && selectedComplaint.status !== 'completed') {
          await handleStatusChange(complaintId, 'completed');
        }

        await qc.invalidateQueries({
          queryKey: ['officer-complaints', token],
        });

        if (selectedComplaint && data.resolution_photo_url) {
          setSelectedComplaint({
            ...selectedComplaint,
            resolution_photo_url: data.resolution_photo_url,
            status: 'completed',
          });
        }
      } else {
        toast.error((data as any).error || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('[Officer Dashboard] Photo upload error:', error);
      toast.error('Error uploading photo');
    } finally {
      setUploadingId(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('officer_token');
    navigate('/officer-login');
  };

  if (authLoading || !officer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 bg-gray-300 rounded-full mx-auto mb-4 animate-pulse"></div>
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-red-600 font-semibold mb-2">{t('error_loading')}</div>
            <p className="text-sm text-muted-foreground mb-4">
              {error instanceof Error ? error.message : t('failed_load_complaints')}
            </p>
            <Button onClick={() => window.location.reload()} className="w-full">
              {t('retry')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('officer_dashboard')}</h1>
            <p className="text-sm text-muted-foreground">
              {officer.name} • {officer.department}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/')}>
              {t('back_to_main')}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              {t('logout')}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{complaints.length}</div>
              <p className="text-sm text-muted-foreground">{t('total_complaints')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-600">
                {complaints.filter((c) => c.status === 'pending').length}
              </div>
              <p className="text-sm text-muted-foreground">{t('pending')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">
                {complaints.filter((c) => c.status === 'in progress').length}
              </div>
              <p className="text-sm text-muted-foreground">{t('in_progress')}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">
                {complaints.filter((c) => c.status === 'completed').length}
              </div>
              <p className="text-sm text-muted-foreground">{t('completed')}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={t('filter_status')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_statuses')}</SelectItem>
              <SelectItem value="pending">{t('pending')}</SelectItem>
              <SelectItem value="in progress">{t('in_progress')}</SelectItem>
              <SelectItem value="completed">{t('completed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('complaints_list')}</CardTitle>
                <CardDescription>
                  {t('showing')} {filtered.length} {t('of')} {complaints.length} {t('complaints_list').toLowerCase()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[600px] overflow-auto">
                  {isLoading && (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="h-6 w-6 bg-gray-300 rounded-full mx-auto mb-2 animate-pulse"></div>
                      {t('loading')}
                    </div>
                  )}
                  {!isLoading && filtered.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      {t('no_complaints_found')}
                    </div>
                  )}
                  {!isLoading && filtered.length > 0 && (
                    <>
                      {filtered.map((complaint) => (
                        <div
                          key={complaint.id}
                          onClick={() => setSelectedComplaint(complaint)}
                          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm">
                                {complaint.category} - {complaint.district || 'N/A'}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {complaint.description}
                              </p>
                              <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(complaint.created_at).toLocaleDateString()}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {complaint.location_text || 'Location pending'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  complaint.status === 'completed'
                                    ? 'bg-green-100 text-green-800'
                                    : complaint.status === 'in progress'
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {complaint.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            {selectedComplaint ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('complaint_details')}</CardTitle>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕ {t('sign_out')}
                  </button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs">{t('category_label')}</Label>
                    <p className="font-medium">{selectedComplaint.category}</p>
                  </div>

                  <div>
                    <Label className="text-xs">{t('description_label')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedComplaint.description}
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs">{t('location_label')}</Label>
                    <p className="text-sm">
                      {selectedComplaint.location_text ||
                        `${selectedComplaint.district}, ${selectedComplaint.city}`}
                    </p>
                  </div>


                  <div>
                    <Label className="text-xs mb-2 block">{t('status_label')}</Label>
                    <Select
                      value={selectedComplaint.status}
                      onValueChange={(newStatus) =>
                        handleStatusChange(selectedComplaint.id, newStatus)
                      }
                    >
                      <SelectTrigger disabled={updatingId === selectedComplaint.id}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t('pending')}</SelectItem>
                        <SelectItem value="in progress">{t('in_progress')}</SelectItem>
                        <SelectItem value="completed">{t('completed')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedComplaint.media_url && (
                    <div>
                      <Label className="text-xs">{t('submission_photo')}</Label>
                      <img
                        src={selectedComplaint.media_url}
                        alt="Submission"
                        className="mt-2 rounded border w-full max-h-32 object-cover"
                      />
                    </div>
                  )}

                  {selectedComplaint.resolution_photo_url && (
                    <div>
                      <Label className="text-xs">{t('resolution_photo')}</Label>
                      <img
                        src={selectedComplaint.resolution_photo_url}
                        alt="Resolution"
                        className="mt-2 rounded border w-full max-h-32 object-cover"
                      />
                    </div>
                  )}

                  <div>
                    <Label className="text-xs mb-2 block">{t('upload_completion_photo')}</Label>
                    <div className="flex gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        id={`photo-input-${selectedComplaint.id}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleUploadCompletionPhoto(selectedComplaint.id, file);
                            e.target.value = '';
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById(`photo-input-${selectedComplaint.id}`) as HTMLInputElement;
                          input?.click();
                        }}
                        disabled={uploadingId === selectedComplaint.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {uploadingId === selectedComplaint.id ? t('uploading') : t('upload_complete_btn')}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('upload_note')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('select_complaint')}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
