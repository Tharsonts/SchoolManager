import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";

// Schema for login validation
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(3)
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Create demo users 
  await createDemoUsers();
  
  // Function to create predefined demo users
async function createDemoUsers() {
  try {
    // Check if users already exist
    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      console.log("Demo users already exist, skipping creation");
      return;
    }
    
    // Create demo users with hashed passwords
    const demoUsers = [
      {
        id: "admin1",
        email: "admin@escola.com",
        password: await bcrypt.hash("admin123", 10),
        first_name: "Admin",
        last_name: "Escola",
        role: "admin",
        profile_image_url: "https://ui-avatars.com/api/?name=Admin+Escola&background=0D8ABC&color=fff"
      },
      {
        id: "coord1",
        email: "coord@escola.com",
        password: await bcrypt.hash("coord123", 10),
        first_name: "Coordenador",
        last_name: "Escola",
        role: "coordinator",
        profile_image_url: "https://ui-avatars.com/api/?name=Coordenador+Escola&background=09A65A&color=fff"
      },
      {
        id: "prof1",
        email: "prof@escola.com",
        password: await bcrypt.hash("prof123", 10),
        first_name: "Professor",
        last_name: "Escola",
        role: "teacher",
        profile_image_url: "https://ui-avatars.com/api/?name=Professor+Escola&background=F59E0B&color=fff"
      },
      {
        id: "aluno1",
        email: "aluno@escola.com",
        password: await bcrypt.hash("aluno123", 10),
        first_name: "Aluno",
        last_name: "Escola",
        role: "student",
        profile_image_url: "https://ui-avatars.com/api/?name=Aluno+Escola&background=DB2777&color=fff"
      }
    ];
    
    // Insert demo users
    for (const user of demoUsers) {
      await db.insert(users).values(user);
    }
    
    console.log("Demo users created successfully");
    
    // Create some demo classes
    const demoClasses = [
      {
        name: "Turma 1A",
        grade: "Ensino Fundamental",
        year: "2025",
        room: "Sala 101",
        teacherId: "prof1"
      },
      {
        name: "Turma 2B",
        grade: "Ensino Fundamental",
        year: "2025",
        room: "Sala 102",
        teacherId: "prof1"
      },
      {
        name: "Turma 3C",
        grade: "Ensino Médio",
        year: "2025",
        room: "Sala 201",
        teacherId: "prof1"
      }
    ];
    
    // Insert demo classes and store their IDs
    const classIds = [];
    for (const classData of demoClasses) {
      const createdClass = await storage.createClass(classData);
      classIds.push(createdClass.id);
    }
    
    // Create demo subjects
    const demoSubjects = [
      {
        name: "Matemática",
        description: "Álgebra, geometria e cálculo",
        teacherId: "prof1"
      },
      {
        name: "Português",
        description: "Gramática e literatura",
        teacherId: "prof1"
      },
      {
        name: "Ciências",
        description: "Física, química e biologia",
        teacherId: "prof1"
      },
      {
        name: "História",
        description: "História mundial e do Brasil",
        teacherId: "prof1"
      }
    ];
    
    // Insert demo subjects and store their IDs
    const subjectIds = [];
    for (const subject of demoSubjects) {
      const createdSubject = await storage.createSubject(subject);
      subjectIds.push(createdSubject.id);
    }
    
    // Create demo events
    const currentDate = new Date();
    const demoEvents = [
      {
        title: "Reunião de Pais",
        description: "Reunião com pais e responsáveis para discutir o desempenho dos alunos",
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 15).toISOString().split('T')[0],
        startTime: "18:00",
        endTime: "20:00",
        location: "Auditório",
        type: "meeting",
        createdBy: "coord1"
      },
      {
        title: "Prova Bimestral",
        description: "Provas do primeiro bimestre",
        date: new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 10).toISOString().split('T')[0],
        startTime: "08:00",
        endTime: "12:00",
        location: "Salas de aula",
        type: "exam",
        createdBy: "prof1"
      },
      {
        title: "Feira de Ciências",
        description: "Alunos apresentam projetos científicos",
        date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 20).toISOString().split('T')[0],
        startTime: "09:00",
        endTime: "16:00",
        location: "Pátio",
        type: "activity",
        createdBy: "coord1"
      }
    ];
    
    // Insert demo events
    for (const event of demoEvents) {
      await storage.createEvent(event);
    }
    
    // Create demo grades
    if (classIds.length > 0 && subjectIds.length > 0) {
      const demoGrades = [
        {
          studentId: "aluno1",
          classId: classIds[0],
          subjectId: subjectIds[0], // Matemática
          period: "1º Bimestre",
          value: 8.5,
          teacherId: "prof1",
          comments: "Bom desempenho em álgebra, precisa melhorar em geometria."
        },
        {
          studentId: "aluno1",
          classId: classIds[0],
          subjectId: subjectIds[1], // Português
          period: "1º Bimestre",
          value: 7.8,
          teacherId: "prof1",
          comments: "Boa redação, precisa melhorar em gramática."
        },
        {
          studentId: "aluno1",
          classId: classIds[0],
          subjectId: subjectIds[2], // Ciências
          period: "1º Bimestre",
          value: 9.2,
          teacherId: "prof1",
          comments: "Excelente desempenho em experimentos e relatórios."
        }
      ];
      
      // Insert demo grades
      for (const grade of demoGrades) {
        await storage.createGrade(grade);
      }
      
      // Create demo attendance records
      const currentDate = new Date();
      const yesterday = new Date(currentDate);
      yesterday.setDate(currentDate.getDate() - 1);
      const twoDaysAgo = new Date(currentDate);
      twoDaysAgo.setDate(currentDate.getDate() - 2);
      
      const demoAttendance = [
        {
          studentId: "aluno1",
          classId: classIds[0],
          subjectId: subjectIds[0],
          date: currentDate.toISOString().split('T')[0],
          status: "present",
          teacherId: "prof1"
        },
        {
          studentId: "aluno1",
          classId: classIds[0],
          subjectId: subjectIds[1],
          date: yesterday.toISOString().split('T')[0],
          status: "present",
          teacherId: "prof1"
        },
        {
          studentId: "aluno1",
          classId: classIds[0],
          subjectId: subjectIds[2],
          date: twoDaysAgo.toISOString().split('T')[0],
          status: "absent",
          teacherId: "prof1",
          comments: "Ausência justificada por atestado médico."
        }
      ];
      
      // Insert demo attendance
      for (const attendance of demoAttendance) {
        await storage.createAttendance(attendance);
      }
      
      // Create demo diary entries
      const demoDiaryEntries = [
        {
          teacherId: "prof1",
          classId: classIds[0],
          subjectId: subjectIds[0],
          date: currentDate.toISOString().split('T')[0],
          content: "Aula sobre equações de segundo grau. Exercícios das páginas 45-48 para casa."
        },
        {
          teacherId: "prof1",
          classId: classIds[0],
          subjectId: subjectIds[1],
          date: yesterday.toISOString().split('T')[0],
          content: "Aula sobre análise sintática. Redação sobre 'Meu futuro profissional' para entregar na próxima aula."
        }
      ];
      
      // Insert demo diary entries
      for (const diaryEntry of demoDiaryEntries) {
        await storage.createDiaryEntry(diaryEntry);
      }
    }
    
    // Create demo notifications
    const demoNotifications = [
      {
        title: "Boas-vindas",
        message: "Bem-vindo ao novo sistema escolar! Explore as funcionalidades.",
        type: "info",
        senderId: "admin1",
        targetId: "all",
        targetType: "all"
      },
      {
        title: "Agenda de Provas",
        message: "As provas do primeiro bimestre serão realizadas na próxima semana.",
        type: "reminder",
        senderId: "coord1",
        targetId: "all",
        targetType: "all"
      },
      {
        title: "Trabalho de Matemática",
        message: "Trabalho sobre funções quadráticas deve ser entregue até dia 10/05.",
        type: "assignment",
        senderId: "prof1",
        targetId: "aluno1",
        targetType: "user"
      }
    ];
    
    // Insert demo notifications
    for (const notification of demoNotifications) {
      await storage.createNotification(notification);
    }
    
    console.log("Demo data created successfully");
    
  } catch (error) {
    console.error("Error creating demo users:", error);
  }
}

  // Custom login route
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      // Find user by email
      const [user] = await db.select().from(users).where(eq(users.email, email));
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password || '');
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Set user in session
      req.login({ 
        claims: { 
          sub: user.id,
          email: user.email,
          role: user.role 
        } 
      }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        return res.status(200).json({ user });
      });
      
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = (req.user as any).claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Invalid user session" });
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password to client
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  
  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((error) => {
        if (error) {
          console.error("Error destroying session:", error);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        return res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  // Users routes
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Classes routes
  app.get('/api/classes', isAuthenticated, async (req, res) => {
    try {
      const classes = await storage.getAllClasses();
      res.json(classes);
    } catch (error) {
      console.error("Error fetching classes:", error);
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post('/api/classes', isAuthenticated, async (req, res) => {
    try {
      const newClass = req.body;
      const createdClass = await storage.createClass(newClass);
      res.status(201).json(createdClass);
    } catch (error) {
      console.error("Error creating class:", error);
      res.status(500).json({ message: "Failed to create class" });
    }
  });

  // Subjects routes
  app.get('/api/subjects', isAuthenticated, async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // Grades routes
  app.get('/api/grades', isAuthenticated, async (req, res) => {
    try {
      const classId = req.query.classId;
      const subjectId = req.query.subjectId;
      
      if (!classId || !subjectId) {
        return res.status(400).json({ message: "Class ID and Subject ID are required" });
      }
      
      const grades = await storage.getGradesByClassAndSubject(classId as string, subjectId as string);
      res.json(grades);
    } catch (error) {
      console.error("Error fetching grades:", error);
      res.status(500).json({ message: "Failed to fetch grades" });
    }
  });

  app.post('/api/grades', isAuthenticated, async (req, res) => {
    try {
      const gradeData = req.body;
      const createdGrade = await storage.createGrade(gradeData);
      res.status(201).json(createdGrade);
    } catch (error) {
      console.error("Error creating grade:", error);
      res.status(500).json({ message: "Failed to create grade" });
    }
  });

  // Attendance routes
  app.get('/api/attendance', isAuthenticated, async (req, res) => {
    try {
      const classId = req.query.classId;
      const date = req.query.date;
      
      if (!classId || !date) {
        return res.status(400).json({ message: "Class ID and date are required" });
      }
      
      const attendance = await storage.getAttendanceByClassAndDate(classId as string, date as string);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.post('/api/attendance', isAuthenticated, async (req, res) => {
    try {
      const attendanceData = req.body;
      const createdAttendance = await storage.createAttendance(attendanceData);
      res.status(201).json(createdAttendance);
    } catch (error) {
      console.error("Error creating attendance:", error);
      res.status(500).json({ message: "Failed to create attendance" });
    }
  });

  // Events routes
  app.get('/api/events', isAuthenticated, async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  app.post('/api/events', isAuthenticated, async (req, res) => {
    try {
      const eventData = req.body;
      const createdEvent = await storage.createEvent(eventData);
      res.status(201).json(createdEvent);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  // Diary entries routes
  app.get('/api/diary', isAuthenticated, async (req, res) => {
    try {
      const classId = req.query.classId;
      const subjectId = req.query.subjectId;
      
      if (!classId || !subjectId) {
        return res.status(400).json({ message: "Class ID and Subject ID are required" });
      }
      
      const diaryEntries = await storage.getDiaryEntriesByClassAndSubject(classId as string, subjectId as string);
      res.json(diaryEntries);
    } catch (error) {
      console.error("Error fetching diary entries:", error);
      res.status(500).json({ message: "Failed to fetch diary entries" });
    }
  });

  app.post('/api/diary', isAuthenticated, async (req, res) => {
    try {
      const diaryData = req.body;
      const createdDiaryEntry = await storage.createDiaryEntry(diaryData);
      res.status(201).json(createdDiaryEntry);
    } catch (error) {
      console.error("Error creating diary entry:", error);
      res.status(500).json({ message: "Failed to create diary entry" });
    }
  });

  // Notifications/messages routes
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const notifications = await storage.getNotificationsByUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.post('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const notificationData = req.body;
      const createdNotification = await storage.createNotification(notificationData);
      res.status(201).json(createdNotification);
    } catch (error) {
      console.error("Error creating notification:", error);
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = req.params.id;
      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
