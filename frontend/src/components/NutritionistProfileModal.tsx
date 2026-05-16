"use client";

import React, { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { 
  X, 
  Star, 
  MapPin, 
  Calendar, 
  Languages, 
  DollarSign, 
  Award,
  Loader2,
  AlertCircle
} from "lucide-react";
import { getNutritionistProfile, resolveApiUrl, unwrapResponse } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NutritionistPublicProfile {
  nutritionist_id: number;
  username: string;
  profile_photo_url: string | null;
  bio: string;
  years_experience: number;
  consultation_price: number;
  specialization_name: string;
  country_name: string;
  languages: string[];
  rating: number;
  consultation_count?: number;
}

interface NutritionistProfileModalProps {
  id: string | number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function NutritionistProfileModal({
  id,
  isOpen,
  onClose,
}: NutritionistProfileModalProps) {
  const [profile, setProfile] = useState<NutritionistPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && id) {
      const fetchProfile = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const raw = await getNutritionistProfile(String(id));
          const data = unwrapResponse(raw);
          setProfile(data as NutritionistPublicProfile);
        } catch (err) {
          console.error("Failed to fetch nutritionist profile:", err);
          setError("Failed to load profile information.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchProfile();
    } else if (!isOpen) {
      // Clear state when closing
      setProfile(null);
      setError(null);
    }
  }, [isOpen, id]);

  const avatarSrc = profile?.profile_photo_url
    ? resolveApiUrl(profile.profile_photo_url)
    : "/placeholder-avatar.png";

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-card p-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl border border-border">
                {/* Close Button */}
                <button
                  type="button"
                  className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors"
                  onClick={onClose}
                >
                  <X className="h-5 w-5" />
                </button>

                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse font-medium">
                      Loading nutritionist profile...
                    </p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                    <p className="text-destructive font-medium">{error}</p>
                    <button
                      onClick={onClose}
                      className="mt-2 text-sm text-primary underline underline-offset-2"
                    >
                      Close
                    </button>
                  </div>
                ) : profile ? (
                  <div className="space-y-8">
                    {/* Header: Avatar and Basic Info */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left pt-2">
                      <div className="relative h-28 w-28 flex-shrink-0">
                        <img
                          src={avatarSrc}
                          alt={profile.username}
                          className="h-full w-full rounded-full object-cover border-4 border-card shadow-lg"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1.5 rounded-full border-2 border-card shadow-sm">
                          <Award className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                          <Dialog.Title className="text-3xl font-bold text-foreground">
                            {profile.username}
                          </Dialog.Title>
                          <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full w-fit mx-auto sm:mx-0">
                            <Star className="h-4 w-4 fill-amber-500" />
                            <span className="text-sm font-bold">
                              {profile.rating > 0 ? profile.rating.toFixed(1) : "N/A"}
                            </span>
                          </div>
                        </div>
                        <p className="text-lg font-medium text-primary">
                          {profile.specialization_name}
                        </p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-3 pt-1">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{profile.years_experience} Years Experience</span>
                          </div>
                          {profile.country_name && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{profile.country_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="bg-muted/50 rounded-xl p-4 text-center">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Price / Session
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          ${profile.consultation_price?.toFixed(2)}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-4 text-center">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Languages
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {profile.languages?.length || 0}
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-xl p-4 text-center col-span-2 sm:col-span-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                          Consultations
                        </p>
                        <p className="text-xl font-bold text-foreground">
                          {profile.consultation_count || "50+"}
                        </p>
                      </div>
                    </div>

                    {/* Bio Section */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                        About Me
                      </h3>
                      <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed">
                        {profile.bio || "No bio information provided."}
                      </div>
                    </div>

                    {/* Footer Info */}
                    <div className="pt-6 border-t border-border space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-3">
                          <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Languages className="h-4 w-4 text-primary" />
                            Spoken Languages
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {profile.languages?.map((lang: string) => (
                              <span
                                key={lang}
                                className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold"
                              >
                                {lang}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3 sm:text-right">
                          <h4 className="text-sm font-bold text-foreground flex items-center gap-2 sm:justify-end">
                            <DollarSign className="h-4 w-4 text-primary" />
                            Session Rate
                          </h4>
                          <p className="text-2xl font-black text-primary">
                            ${profile.consultation_price?.toFixed(2)}
                            <span className="text-xs font-medium text-muted-foreground ml-1 uppercase">USD</span>
                          </p>
                        </div>
                      </div>
                      
                      <button
                        onClick={onClose}
                        className="w-full py-4 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg hover:opacity-90 transition-all uppercase tracking-widest text-sm"
                      >
                        Close Profile
                      </button>
                    </div>
                  </div>
                ) : null}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
