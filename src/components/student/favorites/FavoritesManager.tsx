
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export const useFavoritesManager = () => {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    const savedFavorites = localStorage.getItem('favoriteCourses');
    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('favoriteCourses', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const toggleFavorite = (courseId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(courseId)) {
        newFavorites.delete(courseId);
        toast({
          title: "Course Removed",
          description: "Course removed from favorites",
        });
      } else {
        newFavorites.add(courseId);
        toast({
          title: "Course Added",
          description: "Course added to favorites",
        });
      }
      return newFavorites;
    });
  };

  return { favorites, toggleFavorite };
};
