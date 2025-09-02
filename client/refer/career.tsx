import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Search, Filter, Briefcase, TrendingUp, GraduationCap, Users, Target, Star, Play, ExternalLink, DollarSign, MapPin } from "lucide-react";
import CareerCard from "@/components/career-card";
import type { Career } from "@shared/schema";

// Import student photos for visual appeal
import student1 from "@assets/realistic_photo_of_an_africanamerican_17yearold_smiling_1752249254517.jpg";
import student2 from "@assets/realistic_photo_of_a_latino_17yearold_high (1)_1752248978692.jpg";
import student3 from "@assets/realistic_photo_of_an_africanamerican_17yearold_girl_1752249254519.jpg";
import student4 from "@assets/realistic_photo_of_an_africanamerican_17yearold_girl (4)_1752248978693.jpg";



export default function Career() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  // Search occupations using CareerOneStop API
  const { data: occupations, isLoading: occupationsLoading } = useQuery({
    queryKey: [`/api/careers/careeronestoap/search/${debouncedSearch}`],
    enabled: !!debouncedSearch && debouncedSearch.length >= 3,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
    // Only search when query has at least 3 characters
    if (query.length >= 3) {
      const timeoutId = setTimeout(() => {
        setDebouncedSearch(query);
      }, 800); // Increased debounce time to let user finish typing
      return () => clearTimeout(timeoutId);
    } else {
      setDebouncedSearch("");
    }
  };

  // Use authentic CareerOneStop API data
  const apiCareers = occupations || [];
  
  // Convert API data to displayable format - using authentic CareerOneStop data
  const displayCareers = apiCareers?.map((occupation: any) => ({
    id: occupation.OnetCode || Math.random().toString(),
    title: occupation.OnetTitle || occupation.title,
    description: occupation.Tags || occupation.description || "Career information available",
    category: "General",
    salaryRange: occupation.salaryInfo?.median 
      ? `$${parseInt(occupation.salaryInfo.median).toLocaleString()}/year (${occupation.salaryInfo.location || 'Texas'})`
      : "Salary data unavailable",
    education: occupation.details?.EducationTraining?.EducationTitle || occupation.details?.TypicalEducation || "Education requirements vary",
    onetCode: occupation.OnetCode,
    salaryData: occupation.salaryInfo,
    jobOutlook: occupation.details?.BrightOutlook === 'Yes' ? 'Bright Outlook' : 'Standard Outlook'
  })) || [];

  // No additional filtering needed - API returns filtered results
  const filteredCareers = displayCareers;

  // Pagination logic
  const totalPages = Math.ceil((filteredCareers?.length || 0) / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCareers = filteredCareers?.slice(startIndex, endIndex);

  const isLoading = occupationsLoading;

  // Scroll to top when page changes
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };







  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-android-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="container mx-auto container-padding section-spacing">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Discover Your Future</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore career paths, salary information, and job market trends to make informed decisions about your future
          </p>
        </motion.div>

        {/* Featured Career Opportunities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12"
        >
          <Card 
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-gray-900 shadow-2xl relative overflow-hidden"
            style={{
              backgroundImage: `url(${student2})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundBlendMode: 'overlay'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/90 to-purple-500/90"></div>
            <CardContent className="p-8 text-center relative z-10">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-8 h-8 text-gray-900" />
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Explore Career Opportunities
              </h3>
              <p className="text-lg mb-6 opacity-90">
                Discover authentic career data from the U.S. Department of Labor including salary information, job outlook, and educational requirements
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Real Salary Data</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Job Outlook Trends</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>Texas Market Focus</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>



        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-12"
        >
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <Input
                placeholder="Search careers (e.g., nurse, teacher, engineer)..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-12 py-4 text-lg border-2 border-gray-200 focus:border-android-blue rounded-xl shadow-lg"
              />
            </div>
            <div className="text-center mt-3 text-sm text-gray-500">
              Powered by CareerOneStop API • U.S. Department of Labor
            </div>
          </div>
        </motion.div>

        {/* Search Results */}
        {debouncedSearch.length >= 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                <h2 className="text-2xl font-bold text-gray-900">
                  Search Results {currentCareers?.length > 0 && `(${filteredCareers.length} careers found)`}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedSearch("");
                    setCurrentPage(1);
                  }}
                  className="text-sm"
                >
                  Browse Categories
                </Button>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage(prev => Math.max(1, prev - 1));
                      scrollToTop();
                    }}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCurrentPage(prev => Math.min(totalPages, prev + 1));
                      scrollToTop();
                    }}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            {/* Career Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentCareers?.map((career, index) => (
                <CareerCard key={career.id || index} career={career} index={index} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Search Categories - Only show when no search results */}
        {debouncedSearch.length < 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Career Searches</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[
                { name: 'Nurse', icon: '🏥', description: 'Healthcare professionals' },
                { name: 'Teacher', icon: '📚', description: 'Education specialists' },
                { name: 'Engineer', icon: '⚙️', description: 'Technical professionals' },
                { name: 'Doctor', icon: '🩺', description: 'Medical professionals' },
                { name: 'Therapist', icon: '🧠', description: 'Mental health support' },
                { name: 'Technician', icon: '🔧', description: 'Technical support' },
                { name: 'Manager', icon: '💼', description: 'Business leadership' },
                { name: 'Analyst', icon: '📊', description: 'Data & research' },
              ].map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className="text-center card-hover cursor-pointer"
                  onClick={() => {
                    setSearchQuery(category.name);
                    setDebouncedSearch(category.name);
                    setCurrentPage(1);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="text-3xl mb-2">{category.icon}</div>
                    <h3 className="font-bold text-gray-900 mb-1 text-sm">{category.name}</h3>
                    <p className="text-xs text-gray-600">{category.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
        )}

        {/* Empty state when no search */}
        {!isLoading && !debouncedSearch && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Search for Career Opportunities</h3>
            <p className="text-gray-600 mb-6">Type at least 3 characters to search careers or click on a popular search above to explore authentic career data from the U.S. Department of Labor.</p>
            <div className="flex justify-center items-center space-x-2 text-sm text-gray-500">
              <span>Powered by</span>
              <strong>CareerOneStop API</strong>
              <span>• U.S. Department of Labor</span>
            </div>
          </div>
        )}

        {/* Keep typing message */}
        {searchQuery.length > 0 && searchQuery.length < 3 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">Keep typing...</h3>
            <p className="text-sm text-gray-600">Enter at least 3 characters to search careers.</p>
          </div>
        )}

        {/* No results message */}
        {!isLoading && debouncedSearch && filteredCareers?.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">No careers found</h3>
            <p className="text-sm text-gray-600">Try adjusting your search terms.</p>
          </div>
        )}

        {/* Career Success Story with Student Image */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-16"
        >
          <Card 
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-gray-900 shadow-2xl relative overflow-hidden"
            style={{
              backgroundImage: `url(${student3})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundBlendMode: 'overlay'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/90 to-purple-500/90"></div>
            <CardContent className="p-8 relative z-10">
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-4">
                  Your Career Journey Starts Here
                </h3>
                <p className="text-lg mb-6 opacity-90 max-w-2xl mx-auto">
                  Explore authentic career data from the U.S. Department of Labor to make informed decisions about your future.
                </p>
                
                <div className="flex justify-center mb-8">
                  <Button
                    variant="secondary"
                    className="bg-white/20 hover:bg-white/30 text-gray-900 border-white/30"
                    onClick={() => window.open('https://www.careeronestop.org/ExploreCareers/explore-careers.aspx', '_blank')}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Advanced Career Search
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src={student1} 
                      alt="Student exploring careers"
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  </div>
                  <div className="relative rounded-lg overflow-hidden shadow-lg">
                    <img 
                      src={student4} 
                      alt="Student planning future"
                      className="w-full h-24 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CareerOneStop Attribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="mt-8 text-center"
        >
          <div className="flex items-center justify-center space-x-2 text-gray-600">
            <ExternalLink className="w-4 h-4" />
            <span className="text-sm">Career data powered by CareerOneStop, sponsored by the U.S. Department of Labor</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
