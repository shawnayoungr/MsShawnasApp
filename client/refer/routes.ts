import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { CollegeScorecardService } from "./college-scorecard-service";
import { collegeUrlMapper } from "./college-url-mapper";
import { careerOneStopService } from "./careeronestoap-service";
import { insertChecklistItemSchema, insertCollegeSchema, insertScholarshipSchema, insertCareerSchema, insertFafsaStepSchema } from "@shared/schema";

// Initialize College Scorecard service
const scorecardService = process.env.COLLEGE_SCORECARD_API_KEY 
  ? new CollegeScorecardService(process.env.COLLEGE_SCORECARD_API_KEY)
  : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Checklist routes
  app.get("/api/checklist", async (req, res) => {
    try {
      const items = await storage.getChecklistItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch checklist items" });
    }
  });

  app.post("/api/checklist", async (req, res) => {
    try {
      const validatedData = insertChecklistItemSchema.parse(req.body);
      const item = await storage.createChecklistItem(validatedData);
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid checklist item data" });
    }
  });

 
  app.patch("/api/checklist/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const item = await storage.updateChecklistItem(id, updates);
      if (!item) {
        return res.status(404).json({ message: "Checklist item not found" });
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update checklist item" });
    }
  });

  // College routes - Enhanced with College Scorecard API
  app.get("/api/colleges", async (req, res) => {
    try {
      const { search, state, type, featured } = req.query;
      let colleges;
      
      if (search) {
        colleges = await storage.searchColleges(search as string);
      } else if (state) {
        colleges = await storage.searchCollegesByState(state as string);
      } else if (type) {
        colleges = await storage.getCollegesByType(type as string);
      } else if (featured === 'true') {
        colleges = (await storage.getColleges()).filter(c => c.featured);
      } else {
        colleges = await storage.getColleges();
      }
      
      res.json(colleges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch colleges" });
    }
  });

  // College Scorecard API integration endpoints
  app.get("/api/colleges/scorecard/search", async (req, res) => {
    try {
      if (!scorecardService) {
        return res.status(503).json({ 
          message: "College Scorecard API key not configured. Please add your API key to environment variables." 
        });
      }

      const { query, limit = 20 } = req.query;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }

      const scorecardData = await scorecardService.searchColleges(query as string, parseInt(limit as string));
      const colleges = scorecardData.map(data => scorecardService.transformToCollegeData(data));
      
      res.json(colleges);
    } catch (error) {
      console.error("College Scorecard API error:", error);
      res.status(500).json({ message: "Failed to search colleges via College Scorecard API" });
    }
  });

  app.get("/api/colleges/scorecard/state/:state", async (req, res) => {
    try {
      if (!scorecardService) {
        return res.status(503).json({ 
          message: "College Scorecard API key not configured. Please add your API key to environment variables." 
        });
      }

      const { state } = req.params;
      const { limit = 200 } = req.query;

      const scorecardData = await scorecardService.getCollegesByState(state, parseInt(limit as string));
      const colleges = scorecardData.map(data => scorecardService.transformToCollegeData(data));
      
      res.json(colleges);
    } catch (error) {
      console.error("College Scorecard API error:", error);
      res.status(500).json({ message: "Failed to fetch colleges by state" });
    }
  });

  // Get colleges with field of study data from College Scorecard API
  app.get("/api/colleges/scorecard/state/:state/programs", async (req, res) => {
    try {
      if (!scorecardService) {
        return res.status(503).json({ 
          message: "College Scorecard API key not configured. Please add your API key to environment variables." 
        });
      }

      const { state } = req.params;
      const { limit = 200 } = req.query;

      const colleges = await scorecardService.getCollegesByStateWithPrograms(state, parseInt(limit as string));
      
      // Fix college website URLs using our URL mapper
      const collegesWithFixedUrls = colleges.map(college => ({
        ...college,
        'school.school_url': collegeUrlMapper.getCorrectUrl(
          college['school.name'],
          college['school.school_url']
        )
      }));
      
      res.json(collegesWithFixedUrls);
    } catch (error) {
      console.error("College Scorecard API error:", error);
      res.status(500).json({ message: "Failed to fetch colleges with programs from College Scorecard" });
    }
  });

  // Get available CIP codes from College Scorecard API
  app.get("/api/colleges/scorecard/cip-codes", async (req, res) => {
    try {
      if (!scorecardService) {
        return res.status(503).json({ 
          message: "College Scorecard API key not configured. Please add your API key to environment variables." 
        });
      }

      const cipCodes = await scorecardService.getAvailableCIPCodes();
      res.json(cipCodes);
    } catch (error) {
      console.error("College Scorecard API error:", error);
      res.status(500).json({ message: "Failed to fetch CIP codes from College Scorecard" });
    }
  });

  app.get("/api/colleges/scorecard/featured", async (req, res) => {
    try {
      if (!scorecardService) {
        return res.status(503).json({ 
          message: "College Scorecard API key not configured. Please add your API key to environment variables." 
        });
      }

      const { limit = 20 } = req.query;
      const scorecardData = await scorecardService.getFeaturedColleges(parseInt(limit as string));
      const colleges = scorecardData.map(data => scorecardService.transformToCollegeData(data));
      
      res.json(colleges);
    } catch (error) {
      console.error("College Scorecard API error:", error);
      res.status(500).json({ message: "Failed to fetch featured colleges" });
    }
  });

  app.get("/api/colleges/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const college = await storage.getCollege(id);
      if (!college) {
        return res.status(404).json({ message: "College not found" });
      }
      res.json(college);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch college" });
    }
  });

  app.post("/api/colleges", async (req, res) => {
    try {
      const validatedData = insertCollegeSchema.parse(req.body);
      const college = await storage.createCollege(validatedData);
      res.json(college);
    } catch (error) {
      res.status(400).json({ message: "Invalid college data" });
    }
  });

  // Scholarship routes
  app.get("/api/scholarships", async (req, res) => {
    try {
      const { search } = req.query;
      let scholarships;
      
      if (search) {
        scholarships = await storage.searchScholarships(search as string);
      } else {
        scholarships = await storage.getScholarships();
      }
      
      res.json(scholarships);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scholarships" });
    }
  });

  app.get("/api/scholarships/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const scholarship = await storage.getScholarship(id);
      if (!scholarship) {
        return res.status(404).json({ message: "Scholarship not found" });
      }
      res.json(scholarship);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch scholarship" });
    }
  });

  app.post("/api/scholarships", async (req, res) => {
    try {
      const validatedData = insertScholarshipSchema.parse(req.body);
      const scholarship = await storage.createScholarship(validatedData);
      res.json(scholarship);
    } catch (error) {
      res.status(400).json({ message: "Invalid scholarship data" });
    }
  });

  // Career routes
  app.get("/api/careers", async (req, res) => {
    try {
      const { search } = req.query;
      let careers;
      
      if (search) {
        careers = await storage.searchCareers(search as string);
      } else {
        careers = await storage.getCareers();
      }
      
      res.json(careers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch careers" });
    }
  });

  app.get("/api/careers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const career = await storage.getCareer(id);
      if (!career) {
        return res.status(404).json({ message: "Career not found" });
      }
      res.json(career);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch career" });
    }
  });

  app.post("/api/careers", async (req, res) => {
    try {
      const validatedData = insertCareerSchema.parse(req.body);
      const career = await storage.createCareer(validatedData);
      res.json(career);
    } catch (error) {
      res.status(400).json({ message: "Invalid career data" });
    }
  });

  // CareerOneStop API routes
  app.get("/api/careers/careeronestoap/search/:query", async (req, res) => {
    try {
      if (!careerOneStopService) {
        return res.status(503).json({ 
          message: "CareerOneStop API credentials not configured. Please add your API credentials to environment variables." 
        });
      }

      const { query } = req.params;
      const { location = 'TX' } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }

      // Get basic occupation list first
      const occupations = await careerOneStopService.searchOccupations(query as string, location as string);
      
      // Get detailed information for each occupation
      const enrichedOccupations = await Promise.all(
        occupations.slice(0, 10).map(async (occupation) => {
          try {
            const details = await careerOneStopService.getOccupationDetails(occupation.OnetTitle, location as string);
            const salaryInfo = await careerOneStopService.getSalaryInfo(occupation.OnetTitle, location as string);
            
            console.log(`Education data for ${occupation.OnetTitle}:`, details[0]?.EducationTraining?.EducationTitle || 'No training data');
            console.log(`Salary data for ${occupation.OnetTitle}:`, JSON.stringify(salaryInfo, null, 2));
            
            return {
              ...occupation,
              details: details[0] || null,
              salaryInfo: salaryInfo
            };
          } catch (error) {
            console.error(`Error fetching details for ${occupation.OnetTitle}:`, error);
            return occupation;
          }
        })
      );
      
      res.json(enrichedOccupations);
    } catch (error) {
      console.error("CareerOneStop API error:", error);
      res.status(500).json({ message: "Failed to search occupations" });
    }
  });

  app.get("/api/careers/careeronestoap/details/:keyword", async (req, res) => {
    try {
      if (!careerOneStopService) {
        return res.status(503).json({ 
          message: "CareerOneStop API credentials not configured. Please add your API credentials to environment variables." 
        });
      }

      const { keyword } = req.params;
      const { location = 'TX' } = req.query;

      const occupationDetails = await careerOneStopService.getOccupationDetails(keyword, location as string);
      res.json(occupationDetails);
    } catch (error) {
      console.error("CareerOneStop API error:", error);
      res.status(500).json({ message: "Failed to fetch occupation details" });
    }
  });

  app.get("/api/careers/careeronestoap/salary/:keyword", async (req, res) => {
    try {
      if (!careerOneStopService) {
        return res.status(503).json({ 
          message: "CareerOneStop API credentials not configured. Please add your API credentials to environment variables." 
        });
      }

      const { keyword } = req.params;
      const { location = 'TX' } = req.query;

      const salaryData = await careerOneStopService.getSalaryInfo(keyword, location as string);
      res.json(salaryData);
    } catch (error) {
      console.error("CareerOneStop API error:", error);
      res.status(500).json({ message: "Failed to fetch occupation details" });
    }
  });

  app.get("/api/careers/careeronestoap/clusters", async (req, res) => {
    try {
      if (!careerOneStopService) {
        return res.status(503).json({ 
          message: "CareerOneStop API credentials not configured. Please add your API credentials to environment variables." 
        });
      }

      const clusters = await careerOneStopService.getCareerClusters();
      res.json(clusters);
    } catch (error) {
      console.error("CareerOneStop API error:", error);
      res.status(500).json({ message: "Failed to fetch career clusters" });
    }
  });

  app.get("/api/careers/careeronestoap/jobs/:keyword", async (req, res) => {
    try {
      if (!careerOneStopService) {
        return res.status(503).json({ 
          message: "CareerOneStop API credentials not configured. Please add your API credentials to environment variables." 
        });
      }

      const { keyword } = req.params;
      const { location = 'TX', radius = 25 } = req.query;

      const jobs = await careerOneStopService.getJobListings(keyword, location as string, parseInt(radius as string));
      res.json(jobs);
    } catch (error) {
      console.error("CareerOneStop API error:", error);
      res.status(500).json({ message: "Failed to fetch job listings" });
    }
  });

  // FAFSA routes
  app.get("/api/fafsa", async (req, res) => {
    try {
      const steps = await storage.getFafsaSteps();
      res.json(steps);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FAFSA steps" });
    }
  });

  app.get("/api/fafsa/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const step = await storage.getFafsaStep(id);
      if (!step) {
        return res.status(404).json({ message: "FAFSA step not found" });
      }
      res.json(step);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch FAFSA step" });
    }
  });

  app.post("/api/fafsa", async (req, res) => {
    try {
      const validatedData = insertFafsaStepSchema.parse(req.body);
      const step = await storage.createFafsaStep(validatedData);
      res.json(step);
    } catch (error) {
      res.status(400).json({ message: "Invalid FAFSA step data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
