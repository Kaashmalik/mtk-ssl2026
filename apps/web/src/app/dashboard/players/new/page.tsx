"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@mtk/ui/components/ui/button"
import { Input } from "@mtk/ui/components/ui/input"
import { Label } from "@mtk/ui/components/ui/label"
import { Textarea } from "@mtk/ui/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@mtk/ui/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@mtk/ui/components/ui/card"
import { MotionWrapper } from "@mtk/ui/components/ui/motion-wrapper"
import { ArrowLeft, Save, Loader2 } from "lucide-react"

export default function NewPlayerPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", dateOfBirth: "",
    nationality: "", city: "",
    role: "", battingStyle: "", bowlingStyle: "",
    jerseyNumber: "", heightCm: "", weightKg: "",
    biography: "",
  })

  const updateField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // TODO: Replace with createPlayer action when tenant is available
      // await createPlayer({ ...formData, tenantId: currentTenantId })
      await new Promise(r => setTimeout(r, 1000)) // Simulate API call
      router.push("/dashboard/players")
    } catch (error) {
      console.error("Failed to create player:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <MotionWrapper variant="fadeInLeft">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/players">
            <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Register Player</h1>
            <p className="text-muted-foreground mt-1">Add a new player to your league database.</p>
          </div>
        </div>
      </MotionWrapper>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <MotionWrapper variant="fadeInUp" delay={0.1}>
          <Card>
            <CardHeader><CardTitle className="text-lg">Personal Information</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input id="name" value={formData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. Ahmed Khan" required className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="player@example.com" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="+92 300 1234567" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" value={formData.dateOfBirth} onChange={(e) => updateField("dateOfBirth", e.target.value)} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="nationality">Nationality</Label>
                <Input id="nationality" value={formData.nationality} onChange={(e) => updateField("nationality", e.target.value)} placeholder="Pakistani" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={formData.city} onChange={(e) => updateField("city", e.target.value)} placeholder="Lahore" className="mt-1.5" />
              </div>
            </CardContent>
          </Card>
        </MotionWrapper>

        {/* Cricket Details */}
        <MotionWrapper variant="fadeInUp" delay={0.2}>
          <Card>
            <CardHeader><CardTitle className="text-lg">Cricket Details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Playing Role</Label>
                <Select value={formData.role} onValueChange={(v) => updateField("role", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="batsman">Batsman</SelectItem>
                    <SelectItem value="bowler">Bowler</SelectItem>
                    <SelectItem value="all_rounder">All-Rounder</SelectItem>
                    <SelectItem value="wicket_keeper">Wicket Keeper</SelectItem>
                    <SelectItem value="wicket_keeper_batsman">WK-Batsman</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Batting Style</Label>
                <Select value={formData.battingStyle} onValueChange={(v) => updateField("battingStyle", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select style" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right">Right-Hand Bat</SelectItem>
                    <SelectItem value="left">Left-Hand Bat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bowling Style</Label>
                <Select value={formData.bowlingStyle} onValueChange={(v) => updateField("bowlingStyle", v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select style" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="right_arm_fast">Right-Arm Fast</SelectItem>
                    <SelectItem value="right_arm_medium">Right-Arm Medium</SelectItem>
                    <SelectItem value="right_arm_spin">Right-Arm Spin</SelectItem>
                    <SelectItem value="left_arm_fast">Left-Arm Fast</SelectItem>
                    <SelectItem value="left_arm_medium">Left-Arm Medium</SelectItem>
                    <SelectItem value="left_arm_spin">Left-Arm Spin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="jersey">Jersey Number</Label>
                <Input id="jersey" type="number" value={formData.jerseyNumber} onChange={(e) => updateField("jerseyNumber", e.target.value)} placeholder="7" min={0} max={999} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="height">Height (cm)</Label>
                <Input id="height" type="number" value={formData.heightCm} onChange={(e) => updateField("heightCm", e.target.value)} placeholder="175" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input id="weight" type="number" value={formData.weightKg} onChange={(e) => updateField("weightKg", e.target.value)} placeholder="72" className="mt-1.5" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="bio">Biography</Label>
                <Textarea id="bio" value={formData.biography} onChange={(e) => updateField("biography", e.target.value)} placeholder="Brief bio about the player..." rows={3} className="mt-1.5" />
              </div>
            </CardContent>
          </Card>
        </MotionWrapper>

        {/* Actions */}
        <MotionWrapper variant="fadeInUp" delay={0.3}>
          <div className="flex items-center justify-end gap-3">
            <Link href="/dashboard/players"><Button variant="outline" type="button">Cancel</Button></Link>
            <Button type="submit" variant="gradient-shine" disabled={isSubmitting || !formData.name}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : <><Save className="h-4 w-4 mr-2" />Register Player</>}
            </Button>
          </div>
        </MotionWrapper>
      </form>
    </div>
  )
}
