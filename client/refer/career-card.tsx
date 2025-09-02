import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, GraduationCap, DollarSign } from "lucide-react";
import type { Career } from "@shared/schema";

interface CareerCardProps {
  career: Career;
  index: number;
}

export default function CareerCard({ career, index }: CareerCardProps) {
  const formatSalary = (salaryData: any) => {
    if (!salaryData || !salaryData.median) {
      return "Salary data unavailable";
    }
    
    const amount = parseInt(salaryData.median.replace(/[^\d]/g, ''));
    if (isNaN(amount)) return "Salary data unavailable";
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
      notation: 'compact'
    }).format(amount);
  };

  const formatEducation = (education: string) => {
    if (!education || education === "Education requirements vary") {
      return "Education requirements vary";
    }
    
    // Convert common education codes to readable format based on BLS standards
    const educationMap: { [key: string]: string } = {
      'Associate degree': 'Associate Degree',
      'Bachelor\'s degree': 'Bachelor\'s Degree', 
      'Master\'s degree': 'Master\'s Degree',
      'Doctoral or professional degree': 'Doctoral or Professional Degree',
      'High school diploma or equivalent': 'High School Diploma',
      'Some college, no degree': 'Some College',
      'Postsecondary nondegree award': 'Certificate Program',
      'No formal educational credential': 'No Formal Education Required'
    };
    
    return educationMap[education] || education;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="h-full"
    >
      <Card className="h-full card-hover cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{career.title}</h3>
              <div className="text-right">
                <div className="text-sm font-bold text-android-green">
                  {formatSalary(career.salaryData)}
                </div>
                <div className="text-xs text-gray-500">Annual Salary</div>
              </div>
            </div>
          </div>

          <p className="text-gray-600 mb-4 text-sm leading-relaxed">
            {career.description}
          </p>



          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-900 text-sm">Education Required:</h4>
            </div>
            <p className="text-sm text-gray-700 mb-3">{formatEducation(career.education)}</p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                U.S. Department of Labor
              </div>
              <Button size="sm" className="bg-android-blue hover:bg-android-purple">
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
