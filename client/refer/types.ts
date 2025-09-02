export interface QuickAccessItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  href: string;
}

export interface ProgressItem {
  id: string;
  title: string;
  progress: number;
  color: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  quote: string;
  school: string;
  major: string;
  image: string;
}
