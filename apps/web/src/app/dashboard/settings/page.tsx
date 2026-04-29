import { MotionWrapper } from "@mtk/ui/components/ui/motion-wrapper"

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <MotionWrapper variant="fadeInLeft">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your settings.</p>
            </MotionWrapper>
        </div>
    )
}
