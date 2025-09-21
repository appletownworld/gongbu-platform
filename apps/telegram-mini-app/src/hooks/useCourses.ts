import { useState, useEffect } from 'react';

interface Course {
  id: string;
  title: string;
  description?: string;
  image?: string;
  lessons?: Lesson[];
  studentsCount?: number;
  completionRate?: number;
  difficulty?: string;
  duration?: number;
  price?: number;
  isPremium?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Lesson {
  id: string;
  title: string;
  content?: string;
  description?: string;
  videoUrl?: string;
  audioUrl?: string;
  duration?: number;
  order: number;
  isCompleted?: boolean;
  type?: string;
  isPaid?: boolean;
  price?: number;
  currency?: string;
}

interface UseCoursesReturn {
  courses: Course[];
  currentCourse: Course | null;
  isLoading: boolean;
  error: string | null;
  setCurrentCourse: (course: Course | null) => void;
  createCourse: (courseData: Partial<Course>) => Promise<Course>;
  updateCourse: (courseId: string, courseData: Partial<Course>) => Promise<Course>;
  deleteCourse: (courseId: string) => Promise<void>;
  refreshCourses: () => Promise<void>;
}

export const useCourses = (): UseCoursesReturn => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load courses from localStorage on mount
  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async (): Promise<void> => {
    try {
      const savedCourses = localStorage.getItem('gongbu_courses');
      if (savedCourses) {
        const coursesData = JSON.parse(savedCourses);
        setCourses(coursesData);
      } else {
        // Initialize with sample data
        const sampleCourses: Course[] = [
          {
            id: '1',
            title: 'Introduction to Programming',
            description: 'Learn the basics of programming with this comprehensive course.',
            lessons: [
              {
                id: '1-1',
                title: 'What is Programming?',
                content: 'Programming is the process of creating instructions for computers to follow.',
                order: 1,
                isCompleted: false
              },
              {
                id: '1-2',
                title: 'Variables and Data Types',
                content: 'Learn about different types of data and how to store them.',
                order: 2,
                isCompleted: false
              },
              {
                id: '1-3',
                title: 'Control Structures',
                content: 'Understand how to control the flow of your program.',
                order: 3,
                isCompleted: false
              }
            ],
            studentsCount: 150,
            completionRate: 85,
            difficulty: 'beginner',
            duration: 120,
            price: 0,
            isPremium: false
          },
          {
            id: '2',
            title: 'Advanced React Development',
            description: 'Master advanced React concepts and patterns.',
            lessons: [
              {
                id: '2-1',
                title: 'React Hooks Deep Dive',
                content: 'Explore advanced React hooks and custom hooks.',
                order: 1,
                isCompleted: false
              },
              {
                id: '2-2',
                title: 'State Management',
                content: 'Learn about Redux, Context API, and other state management solutions.',
                order: 2,
                isCompleted: false
              }
            ],
            studentsCount: 89,
            completionRate: 72,
            difficulty: 'advanced',
            duration: 180,
            price: 29.99,
            isPremium: true
          }
        ];
        setCourses(sampleCourses);
        localStorage.setItem('gongbu_courses', JSON.stringify(sampleCourses));
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      setError('Failed to load courses');
    }
  };

  const saveCourses = (coursesData: Course[]): void => {
    localStorage.setItem('gongbu_courses', JSON.stringify(coursesData));
  };

  const createCourse = async (courseData: Partial<Course>): Promise<Course> => {
    setIsLoading(true);
    setError(null);

    try {
      const newCourse: Course = {
        id: Date.now().toString(),
        title: courseData.title || 'New Course',
        description: courseData.description || '',
        lessons: courseData.lessons || [],
        studentsCount: 0,
        completionRate: 0,
        difficulty: courseData.difficulty || 'beginner',
        duration: courseData.duration || 0,
        price: courseData.price || 0,
        isPremium: courseData.isPremium || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...courseData
      };

      const updatedCourses = [...courses, newCourse];
      setCourses(updatedCourses);
      saveCourses(updatedCourses);

      // Show success feedback
      if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }

      return newCourse;
    } catch (error) {
      console.error('Error creating course:', error);
      setError('Failed to create course');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<Course> => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedCourses = courses.map(course => 
        course.id === courseId 
          ? { ...course, ...courseData, updatedAt: new Date().toISOString() }
          : course
      );

      setCourses(updatedCourses);
      saveCourses(updatedCourses);

      // Update current course if it's the one being updated
      if (currentCourse?.id === courseId) {
        const updatedCourse = updatedCourses.find(c => c.id === courseId);
        if (updatedCourse) {
          setCurrentCourse(updatedCourse);
        }
      }

      // Show success feedback
      if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }

      const updatedCourse = updatedCourses.find(c => c.id === courseId);
      if (!updatedCourse) {
        throw new Error('Course not found');
      }

      return updatedCourse;
    } catch (error) {
      console.error('Error updating course:', error);
      setError('Failed to update course');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCourse = async (courseId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedCourses = courses.filter(course => course.id !== courseId);
      setCourses(updatedCourses);
      saveCourses(updatedCourses);

      // Clear current course if it's the one being deleted
      if (currentCourse?.id === courseId) {
        setCurrentCourse(null);
      }

      // Show success feedback
      if (window.Telegram?.WebApp?.HapticFeedback?.impactOccurred) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    } catch (error) {
      console.error('Error deleting course:', error);
      setError('Failed to delete course');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCourses = async (): Promise<void> => {
    await loadCourses();
  };

  return {
    courses,
    currentCourse,
    isLoading,
    error,
    setCurrentCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    refreshCourses
  };
};