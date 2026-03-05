import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button, Input, Label, Textarea, Switch, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/components/globalComponents';
import { Building2, Trash2 } from 'lucide-react';
import type { EmployerUser } from '@/types';
import { useUser } from '@/app/components/authComponents';

interface EmployerFormData {
    email: string,
    companyName: string;
    phone: string;
    website: string;
    address: string;
    availableForEvents: boolean;
    sponsor: boolean;
    specialNotes: string;
}

export function EmployerProfilePage() {
    const {user, updateUser, deleteUser} = useUser<'employer'>();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<EmployerFormData>({
        email: '',
        companyName: '',
        phone: '',
        website: '',
        address: '',
        availableForEvents: false,
        sponsor: false,
        specialNotes: '',
    });

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email,
                companyName: user.userData.companyName,
                phone: user.userData.contactInfo?.phone || '',
                website: user.userData.contactInfo?.website || '',
                address: user.userData.contactInfo?.address || '',
                availableForEvents: user.userData.availableForEvents,
                sponsor: user.userData.sponsor,
                specialNotes: user.userData.specialNotes,
            });
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (formData) {
            updateUser({
                email: formData.email,
                userData: {
                    userType: 'employer',
                    companyName: formData.companyName,
                    contactInfo: {
                        phone: formData.phone,
                        website: formData.website,
                        address: formData.address,
                    },
                    availableForEvents: formData.availableForEvents,
                    sponsor: formData.sponsor,
                    specialNotes: formData.specialNotes,
                }
            });
        }
        setIsEditing(false);
    };

    if (!user) return;
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl">Employer Profile</h1>
                            {!isEditing ? (
                                <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    <Button form="profile-form" type="submit">Save Changes</Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Card className="p-6">
                    {isEditing ? (
                        <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
                            <Card>
                                <CardHeader>
                                <CardTitle>Company Information</CardTitle>
                                <CardDescription>Basic information about your organization</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Company Name</Label>
                                    <Input
                                        id="companyName"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Information</CardTitle>
                                    <CardDescription>How students and administrators can reach you</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="website">Website</Label>
                                        <Input
                                            id="website"
                                            type="url"
                                            value={formData.website}
                                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                            placeholder="https://www.example.com"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Textarea
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="Street address, city, state, ZIP"
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Engagement Preferences</CardTitle>
                                    <CardDescription>Set your participation and sponsorship preferences</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="availableForEvents">Available for Events</Label>
                                            <p className="text-sm text-gray-500">Participate in career fairs and networking events</p>
                                        </div>
                                        <Switch
                                            id="availableForEvents"
                                            checked={formData.availableForEvents}
                                            onCheckedChange={(checked) => setFormData({ ...formData, availableForEvents: checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="sponsor">Sponsor</Label>
                                            <p className="text-sm text-gray-500">Sponsor platform events and initiatives</p>
                                        </div>
                                        <Switch
                                            id="sponsor"
                                            checked={formData.sponsor}
                                            onCheckedChange={(checked) => setFormData({ ...formData, sponsor: checked })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Special Notes</CardTitle>
                                    <CardDescription>Additional information or special requirements</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Textarea
                                        value={formData.specialNotes}
                                        onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
                                        placeholder="Any special notes or requirements..."
                                        rows={4}
                                    />
                                </CardContent>
                            </Card>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Company Information</CardTitle>
                                    <CardDescription>Basic information about your organization</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div><Label htmlFor="companyName">Company Name: {user.userData.companyName}</Label></div>
                                    <div><Label htmlFor="companyEmail">Email: {user.email}</Label></div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Contact Information</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div><Label htmlFor="Phone">Phone: {user.userData.contactInfo?.phone || '-'}</Label></div>
                                    <div><Label htmlFor="Website">Website: {user.userData.contactInfo?.website || '-'}</Label></div>
                                    <div><Label htmlFor="Address">Address: {user.userData.contactInfo?.address || '-'}</Label></div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Engagement Preferences</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div><Label htmlFor="Available for Events">Available for Events: {user.userData.availableForEvents ? 'Yes' : 'No'}</Label></div>
                                    <div><Label htmlFor="Sponsor">Sponsor: {user.userData.sponsor ? 'Yes' : 'No'}</Label></div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Special Notes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Label htmlFor="SpecialNotes">{user.userData.specialNotes || '-'}</Label>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                    <div className="p-6 border-red-200">
                        <AlertDialog>
                                <AlertDialogTrigger>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Account
                                    </Button>
                                </AlertDialogTrigger>
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account
                                and remove all your data including saved jobs and searches.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={deleteUser} className="bg-red-600 hover:bg-red-700">
                                Delete Account
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </Card>
            </div>
        </div>
    );
}
