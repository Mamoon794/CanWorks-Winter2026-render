import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Label, CheckBox, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from '@/app/components/globalComponents';
import { User, Mail, GraduationCap, Briefcase, Award, Trash2 } from 'lucide-react';
import type { StudentUser, StudentUserData } from '@/types';
import { useUser} from '@/app/components/authComponents';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => currentYear + i);
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface StudentFormData {
    savedJobs?: string[]; 
    email: string;
    university: string;
    graduationMonth: string;
    graduationYear: string;
    major: string;
    skills: string;
}

export function ProfilePage() {
    const {user, updateUser, deleteUser} = useUser<'student'>();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<StudentFormData>({
        email: '',
        university: '',
        graduationMonth: '',
        graduationYear: '',
        major: '',
        skills: '',
    });
    const [lookingFor, setLookingFor] = useState<('internship' | 'coop' | 'new-grad')[]>([]);
    const [coopSchool, setCoopSchool] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                email: user.email || '',
                university: user.userData?.university || '',
                graduationMonth: user.userData?.graduationMonth || '',
                graduationYear: user.userData?.graduationYear || '',
                major: user.userData?.major || '',
                skills: user.userData?.skills.join(', ') || '',
            });

            setLookingFor(user.userData?.lookingFor || []);
            setCoopSchool(user.userData?.coopSchool || '');
        }
    }, [user]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser({
            email: formData.email,
            userData: {
                userType: 'student',
                university: formData.university,
                graduationMonth: formData.graduationMonth,
                graduationYear: formData.graduationYear,
                lookingFor,
                coopSchool: lookingFor.includes('coop') ? coopSchool : undefined,
                major: formData.major,
                skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
            }
        });
        setIsEditing(false);
    };

    const toggleLookingFor = (type: 'internship' | 'coop' | 'new-grad', checked: boolean) => {
        setLookingFor(prev =>
            prev ? (prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]) : [type]
        );
    };

    // NOTE (HALF): We should never get to this point!!
    if (!user) return;
    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl">Profile Settings</h1>
                    {!isEditing ? (
                        <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                    ) : (
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button form="profile-form" type="submit">Save Changes</Button>
                        </div>
                    )}
                </div>

                <Card className="p-6">
                    {isEditing ? (
                        <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                Email Address
                            </div>
                            </Label>
                            <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="university">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4" />
                                University
                            </div>
                            </Label>
                            <Input
                            id="university"
                            value={formData.university}
                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                            <Label htmlFor="month">Graduation Month</Label>
                            <select
                                id="month"
                                value={formData.graduationMonth}
                                onChange={(e) => setFormData({ ...formData, graduationMonth: e.target.value })}
                                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                            >
                                {months.map(month => (
                                <option key={month} value={month}>{month}</option>
                                ))}
                            </select>
                            </div>

                            <div className="space-y-2">
                            <Label htmlFor="year">Graduation Year</Label>
                            <select
                                id="year"
                                value={formData.graduationYear}
                                onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                                className="w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                            >
                                {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="major">
                            <div className="flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                Major
                            </div>
                            </Label>
                            <Input
                            id="major"
                            value={formData.major}
                            onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Looking For</Label>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <CheckBox
                                    id="edit-internship"
                                    checked={lookingFor.includes('internship')}
                                    onChange={(e) => toggleLookingFor('internship', e.target.checked)}
                                    />
                                    <Label htmlFor="edit-internship" className="cursor-pointer">Internships</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CheckBox
                                    id="edit-coop"
                                    checked={lookingFor.includes('coop')}
                                    onChange={(e) => toggleLookingFor('coop', e.target.checked)}
                                    />
                                    <Label htmlFor="edit-coop" className="cursor-pointer">Co-op Programs</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <CheckBox
                                    id="edit-new-grad"
                                    checked={lookingFor.includes('new-grad')}
                                    onChange={(e) => toggleLookingFor('new-grad', e.target.checked)}
                                    />
                                    <Label htmlFor="edit-new-grad" className="cursor-pointer">New Grad Roles</Label>
                                </div>
                            </div>
                        </div>

                        {lookingFor.includes('coop') && (
                            <div className="space-y-2">
                            <Label htmlFor="coop-school">
                                <div className="flex items-center gap-2">
                                <Award className="w-4 h-4" />
                                Co-op Credits School
                                </div>
                            </Label>
                            <Input
                                id="coop-school"
                                value={coopSchool}
                                onChange={(e) => setCoopSchool(e.target.value)}
                            />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="skills">Skills (comma-separated)</Label>
                            <Input
                            id="skills"
                            value={formData.skills}
                            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                            />
                        </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex items-start gap-3">
                                <Mail className="w-5 h-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <p>{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <GraduationCap className="w-5 h-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-600">Education</p>
                                    <p>{user.userData.university}</p>
                                    <p className="text-sm text-gray-500">
                                        Graduating {user.userData.graduationMonth} {user.userData.graduationYear}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Briefcase className="w-5 h-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-600">Major</p>
                                    <p>{user.userData.major}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <User className="w-5 h-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-600">Looking For</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                    {user.userData.lookingFor.map(type => (
                                    <span key={type} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                                        {type === 'new-grad' ? 'New Grad' : type.charAt(0).toUpperCase() + type.slice(1)}
                                    </span>
                                    ))}
                                </div>
                                {user.userData.coopSchool && (
                                    <p className="text-user.userData text-gray-500 mt-2">
                                    Co-op credits: {user.userData.coopSchool}
                                    </p>
                                )}
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Award className="w-5 h-5 text-gray-400 mt-1" />
                                <div>
                                    <p className="text-sm text-gray-600">Skills</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {user.userData.skills.map(skill => (
                                        <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                                            {skill}
                                        </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
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