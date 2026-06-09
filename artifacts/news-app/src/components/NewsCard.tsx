import { useState } from "react";
import { type NewsItem } from "@/hooks/use-news";
import { motion } from "framer-motion";
import { 
  Share2, 
  MessageCircle, 
  Heart, 
  ChevronUp, 
  Globe, 
  Clock 
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface NewsCardProps {
  item: NewsItem;
  isActive: boolean;
}

export function NewsCard({ item, isActive }: NewsCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div className="relative w-full h-full snap-start shrink-0 overflow-hidden bg-background">
      <div className="absolute inset-0 z-0">
        <img 
          src={item.imageUrl} 
          key={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover transition-transform duration-[10s] ease-linear scale-105 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
      </div>

      <div className="absolute right-4 bottom-32 z-20 flex flex-col gap-6 items-center">
        <button 
          onClick={() => setIsLiked(!isLiked)}
          className="group flex flex-col items-center gap-1"
        >
          <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 transition-all active:scale-90 group-hover:bg-black/40">
            <Heart 
              className={`w-7 h-7 transition-colors ${isLiked ? 'fill-primary text-primary' : 'text-white'}`} 
            />
          </div>
          <span className="text-xs font-medium text-white shadow-sm">1.2k</span>
        </button>

        <button className="group flex flex-col items-center gap-1">
          <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 transition-all active:scale-90 group-hover:bg-black/40">
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs font-medium text-white shadow-sm">342</span>
        </button>

        <button 
          className="group flex flex-col items-center gap-1"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: item.title,
                text: item.summary,
                url: window.location.href,
              }).catch(() => {
                navigator.clipboard.writeText(window.location.href);
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
            }
          }}
        >
          <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 transition-all active:scale-90 group-hover:bg-black/40">
            <Share2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs font-medium text-white shadow-sm">Share</span>
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 z-10 pb-24 flex flex-col items-start gap-4">
        <div className="flex flex-wrap gap-2 animate-in slide-in-from-left-4 fade-in duration-500 delay-100">
          <Badge variant="secondary" className="bg-primary/90 hover:bg-primary text-white border-none px-3 py-1">
            {item.topic}
          </Badge>
          <Badge variant="outline" className="bg-black/30 backdrop-blur-md text-white border-white/20">
            <Globe className="w-3 h-3 mr-1" /> {item.region}
          </Badge>
          <Badge variant="outline" className="bg-black/30 backdrop-blur-md text-white border-white/20">
            <Clock className="w-3 h-3 mr-1" /> {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : 'Just now'}
          </Badge>
        </div>

        <div className="space-y-2 max-w-[85%]">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-shadow leading-tight font-display">
            {item.title}
          </h2>
          <p className="text-gray-200 text-sm md:text-base line-clamp-2 text-shadow">
            {item.summary}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
            <span className="font-semibold text-primary">{item.source}</span>
          </div>
        </div>

        <Drawer>
          <DrawerTrigger asChild>
            <Button 
              variant="outline" 
              className="mt-2 bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md rounded-full px-6 gap-2 group"
            >
              Read Summary <ChevronUp className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[85vh] bg-card border-border">
            <div className="mx-auto w-full max-w-2xl overflow-y-auto max-h-[80vh]">
              <DrawerHeader>
                <div className="flex gap-2 mb-4">
                  <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">{item.topic}</Badge>
                  <Badge variant="secondary">{item.region}</Badge>
                </div>
                <DrawerTitle className="text-2xl md:text-3xl font-display leading-tight mb-2">
                  {item.title}
                </DrawerTitle>
                <DrawerDescription className="flex items-center gap-2 text-muted-foreground">
                   By <span className="font-semibold text-foreground">{item.source}</span> • {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today'}
                </DrawerDescription>
              </DrawerHeader>
              
              <div className="p-4 pt-0">
                <img 
                  src={item.imageUrl} 
                  alt={item.title} 
                  className="w-full h-48 md:h-64 object-cover rounded-xl mb-6 shadow-lg" 
                />
                
                <div className="prose prose-invert prose-lg max-w-none">
                  <p className="mb-4 text-primary font-medium">
                    English Summary & Content:
                  </p>
                  {item.content.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-4 text-gray-300 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
              
              <DrawerFooter className="pt-2 border-t border-border mt-8">
                <div className="flex gap-3 w-full">
                  <Button 
                    className="flex-1 rounded-xl font-bold bg-primary hover:bg-primary/90 text-white"
                    onClick={() => {
                      if (item.externalId) {
                        window.open(item.externalId, '_blank');
                      }
                    }}
                  >
                    View Original (May be in native language)
                  </Button>
                  <DrawerClose asChild>
                    <Button variant="outline" className="rounded-xl border-border bg-transparent">Close</Button>
                  </DrawerClose>
                </div>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}
