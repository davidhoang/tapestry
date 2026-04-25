import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, Check, X } from "lucide-react";

interface LocationConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ModalState = "initial" | "loading" | "success" | "error";

export default function LocationConsentModal({
  open,
  onOpenChange,
  onSuccess,
}: LocationConsentModalProps) {
  const [state, setState] = useState<ModalState>("initial");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const queryClient = useQueryClient();

  const saveLocationMutation = useMutation({
    mutationFn: async (data: {
      latitude?: number;
      longitude?: number;
      city?: string;
      country?: string;
      consent: boolean;
    }) => {
      return apiRequest("/api/user/location", {
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/location"] });
    },
  });

  const reverseGeocode = async (
    latitude: number,
    longitude: number
  ): Promise<{ city?: string; country?: string }> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to reverse geocode");
      }
      const data = await response.json();
      return {
        city:
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.municipality ||
          data.address?.county,
        country: data.address?.country,
      };
    } catch {
      return {};
    }
  };

  const handleEnableLocation = () => {
    setState("loading");
    setErrorMessage("");

    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser");
      setState("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const { city, country } = await reverseGeocode(latitude, longitude);

        try {
          await saveLocationMutation.mutateAsync({
            latitude,
            longitude,
            city,
            country,
            consent: true,
          });

          setState("success");
          setTimeout(() => {
            onOpenChange(false);
            setState("initial");
            if (onSuccess) {
              onSuccess();
            }
          }, 1500);
        } catch {
          setErrorMessage("Failed to save location. Please try again.");
          setState("error");
        }
      },
      (error) => {
        let message = "Failed to get your location.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location permission was denied.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        saveLocationMutation.mutate({ consent: false });
        setErrorMessage(message);
        setState("error");
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000,
      }
    );
  };

  const handleNotNow = async () => {
    try {
      await saveLocationMutation.mutateAsync({ consent: false });
    } catch {
      // Silently fail
    }
    onOpenChange(false);
    setState("initial");
  };

  const handleClose = () => {
    onOpenChange(false);
    setState("initial");
    setErrorMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              {state === "success" ? (
                <Check className="h-7 w-7 text-green-600" />
              ) : state === "error" ? (
                <X className="h-7 w-7 text-destructive" />
              ) : state === "loading" ? (
                <Loader2 className="h-7 w-7 text-primary animate-spin" />
              ) : (
                <MapPin className="h-7 w-7 text-primary" />
              )}
            </div>
          </div>
          <DialogTitle className="text-center">
            {state === "success"
              ? "Location saved!"
              : state === "error"
                ? "Location unavailable"
                : state === "loading"
                  ? "Getting your location..."
                  : "Enable location-based suggestions"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {state === "success" ? (
              "We'll now show you designers in your area."
            ) : state === "error" ? (
              errorMessage
            ) : state === "loading" ? (
              "Please allow location access when prompted."
            ) : (
              <>
                Sharing your location helps us recommend designers near you.
                You'll get better local recommendations and can find talent in
                your area more easily.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {state === "initial" && (
          <div className="flex flex-col gap-2 mt-4">
            <Button onClick={handleEnableLocation}>
              <MapPin className="h-4 w-4 mr-2" />
              Enable location
            </Button>
            <Button variant="ghost" onClick={handleNotNow}>
              Not now
            </Button>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col gap-2 mt-4">
            <Button variant="outline" onClick={handleEnableLocation}>
              Try again
            </Button>
            <Button variant="ghost" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
