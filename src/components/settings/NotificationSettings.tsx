import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Save, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface NotificationSettingsProps {
  onExport: () => void;
}

export function NotificationSettings({ onExport }: NotificationSettingsProps) {
  const settings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.update);

  const [preClassPrompts, setPreClassPrompts] = useState(true);
  const [promptOffset, setPromptOffset] = useState([10]);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);

  useEffect(() => {
    if (settings) {
      setPreClassPrompts(settings.preClassPrompts);
      setPromptOffset([settings.promptOffsetMinutes]);
      setBrowserNotifications(settings.browserNotifications);
      setNotificationSound(settings.notificationSound);
    }
  }, [settings]);

  const handleSaveNotifications = async () => {
    try {
      await updateSettings({
        preClassPrompts,
        promptOffsetMinutes: promptOffset[0],
        browserNotifications,
        notificationSound,
      });
      toast.success("Notification settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>
          Configure how and when you receive attendance reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pre-class Prompts */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="preclass">Pre-class Prompts</Label>
            <p className="text-sm text-muted-foreground">
              Get reminded before your classes start
            </p>
          </div>
          <Switch
            id="preclass"
            checked={preClassPrompts}
            onCheckedChange={setPreClassPrompts}
          />
        </div>

        {/* Prompt Offset */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="offset">Prompt Offset</Label>
            <span className="text-sm font-medium">{promptOffset[0]} minutes</span>
          </div>
          <Slider
            id="offset"
            value={promptOffset}
            onValueChange={setPromptOffset}
            min={5}
            max={60}
            step={5}
            disabled={!preClassPrompts}
          />
          <p className="text-xs text-muted-foreground">
            Get notified {promptOffset[0]} minutes before class
          </p>
        </div>

        {/* Browser Notifications */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="browser">Browser Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Enable desktop notifications
            </p>
          </div>
          <Switch
            id="browser"
            checked={browserNotifications}
            onCheckedChange={setBrowserNotifications}
          />
        </div>

        {/* Notification Sound */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sound">Notification Sound</Label>
            <p className="text-sm text-muted-foreground">
              Play a sound with notifications
            </p>
          </div>
          <Switch
            id="sound"
            checked={notificationSound}
            onCheckedChange={setNotificationSound}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSaveNotifications} className="flex-1">
            <Save size={16} className="mr-2" />
            Save Changes
          </Button>
          <Button onClick={onExport} variant="outline">
            <Download size={16} className="mr-2" />
            Export Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
