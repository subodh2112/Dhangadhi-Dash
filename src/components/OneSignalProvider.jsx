import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";

const APP_ID = "fd326755-d5a1-4617-a634-a8b832a7c00c";

/**
 * Initializes OneSignal Web SDK and registers a push subscription observer.
 * When a real (server-assigned) subscription ID is detected, shows a one-time
 * verification dialog. On "Got it", requests push permission.
 */
export default function OneSignalProvider({ children }) {
  const observerRef = useRef(null);
  const dialogShownRef = useRef(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    window.OneSignalDeferred = window.OneSignalDeferred || [];

    window.OneSignalDeferred.push(function (OneSignal) {
      // Init runs inline in index.html; here we only register the observer
      registerObserver(OneSignal);
    });

    function isRealId(id) {
      return typeof id === "string" && id.length > 0 && !id.startsWith("local-");
    }

    function maybeShowDialog(id) {
      if (isRealId(id) && !dialogShownRef.current) {
        dialogShownRef.current = true;
        setShowDialog(true);
      }
    }

    function registerObserver(OneSignal) {
      // Check current subscription ID immediately (may already be server-assigned)
      try {
        const currentId = OneSignal.User.PushSubscription.id;
        maybeShowDialog(currentId);
      } catch (_) {
        // subscription not available yet
      }

      // Register the change observer — store in ref to prevent weak-ref deallocation
      const handler = function (subscription) {
        maybeShowDialog(subscription?.id);
      };

      try {
        OneSignal.User.PushSubscription.addEventListener("change", handler);
        observerRef.current = { OneSignal, handler };
      } catch (_) {
        // SDK not fully ready — retry on next tick
        setTimeout(() => registerObserver(OneSignal), 1000);
      }
    }

    return () => {
      if (observerRef.current) {
        try {
          observerRef.current.OneSignal.User.PushSubscription.removeEventListener(
            "change",
            observerRef.current.handler
          );
        } catch (_) {
          // already cleaned up
        }
        observerRef.current = null;
      }
    };
  }, []);

  const handleGotIt = async () => {
    setShowDialog(false);
    try {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(function (OneSignal) {
        OneSignal.Notifications.requestPermission();
      });
    } catch (_) {
      // permission request handled by browser
    }
  };

  return (
    <>
      {children}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-saffron/10 flex items-center justify-center mb-2">
              <Bell className="w-6 h-6 text-saffron" />
            </div>
            <DialogTitle>Your OneSignal SDK integration is complete!</DialogTitle>
            <DialogDescription>
              You can now send Push Notifications & In-App Messages through OneSignal. Tap below to enable push notifications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleGotIt} className="w-full bg-saffron hover:bg-saffron/90">
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}