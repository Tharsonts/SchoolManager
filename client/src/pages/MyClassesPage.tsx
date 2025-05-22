import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, Calendar, Users, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

export default function MyClassesPage() {
  const [activeTab, setActiveTab] = useState("current");
  
  // Dados de exemplo - em um sistema real, isso viria do backend
  const currentClasses = [
    {
      id: "1A",
      name: "1º Ano A",
      level: "Ensino Fundamental",
      year: "2023",
      subjects: ["Matemática", "Ciências"],
      students: 30,
      schedule: "Segunda e Quarta, 07:30 - 11:10",
      color: "blue"
    },
    {
      id: "2B",
      name: "2º Ano B",
      level: "Ensino Fundamental",
      year: "2023",
      subjects: ["Português", "História"],
      students: 28,
      schedule: "Terça e Quinta, 07:30 - 11:10",
      color: "green"
    },
    {
      id: "3C",
      name: "3º Ano C",
      level: "Ensino Fundamental",
      year: "2023",
      subjects: ["Geografia", "Artes"],
      students: 25,
      schedule: "Quarta e Sexta, 07:30 - 11:10",
      color: "purple"
    },
  ];

  const pastClasses = [
    {
      id: "1A-2022",
      name: "1º Ano A",
      level: "Ensino Fundamental",
      year: "2022",
      subjects: ["Matemática", "Ciências"],
      students: 32,
      schedule: "Segunda e Quarta, 07:30 - 11:10",
      color: "gray"
    },
    {
      id: "2B-2022",
      name: "2º Ano B",
      level: "Ensino Fundamental",
      year: "2022",
      subjects: ["Português", "História"],
      students: 30,
      schedule: "Terça e Quinta, 07:30 - 11:10",
      color: "gray"
    },
  ];

  function getColorClass(color: string) {
    const colorMap: Record<string, string> = {
      blue: "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800",
      green: "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800",
      purple: "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800",
      amber: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
      red: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
      gray: "bg-gray-50 border-gray-200 dark:bg-gray-800/20 dark:border-gray-700"
    };
    
    return colorMap[color] || colorMap.blue;
  }

  return (
    <MainLayout pageTitle="Minhas Turmas">
      <Tabs defaultValue="current" onValueChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="current">Turmas Atuais</TabsTrigger>
            <TabsTrigger value="past">Turmas Anteriores</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="current">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {currentClasses.map((classItem) => (
              <Card 
                key={classItem.id}
                className={`border-2 ${getColorClass(classItem.color)}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{classItem.name}</CardTitle>
                      <CardDescription>{classItem.level}</CardDescription>
                    </div>
                    <Badge>{classItem.year}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        Disciplinas: {classItem.subjects.join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {classItem.students} alunos
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {classItem.schedule}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Link href={`/class?id=${classItem.id}`}>
                    <Button className="w-full bg-blue-500 hover:bg-blue-600">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Acessar Turma
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Próximas Aulas</CardTitle>
              <CardDescription>Suas próximas aulas agendadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-3 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                  <Calendar className="h-10 w-10 text-blue-500 mr-4" />
                  <div className="flex-1">
                    <h4 className="font-medium">Matemática - 1º Ano A</h4>
                    <p className="text-sm text-muted-foreground">Segunda-feira, 07:30 - 09:10</p>
                  </div>
                  <Badge className="ml-2 bg-blue-500">Hoje</Badge>
                </div>

                <div className="flex items-center p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                  <Calendar className="h-10 w-10 text-green-500 mr-4" />
                  <div className="flex-1">
                    <h4 className="font-medium">Ciências - 1º Ano A</h4>
                    <p className="text-sm text-muted-foreground">Segunda-feira, 09:30 - 11:10</p>
                  </div>
                  <Badge className="ml-2 bg-green-500">Hoje</Badge>
                </div>

                <div className="flex items-center p-3 rounded-md bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                  <Calendar className="h-10 w-10 text-purple-500 mr-4" />
                  <div className="flex-1">
                    <h4 className="font-medium">Português - 2º Ano B</h4>
                    <p className="text-sm text-muted-foreground">Terça-feira, 07:30 - 09:10</p>
                  </div>
                  <Badge className="ml-2 bg-purple-500">Amanhã</Badge>
                </div>

                <div className="flex items-center p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                  <Calendar className="h-10 w-10 text-amber-500 mr-4" />
                  <div className="flex-1">
                    <h4 className="font-medium">História - 2º Ano B</h4>
                    <p className="text-sm text-muted-foreground">Terça-feira, 09:30 - 11:10</p>
                  </div>
                  <Badge className="ml-2 bg-amber-500">Amanhã</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="past">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastClasses.map((classItem) => (
              <Card 
                key={classItem.id}
                className={`border-2 ${getColorClass(classItem.color)}`}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{classItem.name}</CardTitle>
                      <CardDescription>{classItem.level}</CardDescription>
                    </div>
                    <Badge variant="outline">{classItem.year}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        Disciplinas: {classItem.subjects.join(", ")}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {classItem.students} alunos
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span className="text-sm">
                        {classItem.schedule}
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Link href={`/class?id=${classItem.id}`}>
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Histórico
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}