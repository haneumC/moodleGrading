import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="w-full px-6 py-8">
        <RouterLink to="/" className="text-blue-400 hover:text-blue-300 inline-block mb-4 text-xl">
          ← Back to Grading Assistant
        </RouterLink>
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 text-white">Grading Assistant</h1>
          <p className="text-3xl text-gray-400">Empowering graders with efficient grading solutions</p>
        </div>

        {/* Cards Stack */}
        <div className="space-y-8 max-w-[2000px] mx-auto">
          {/* Vision Statement Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-3xl">Vision Statement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-gray-300 text-xl leading-relaxed">
                Our mission is to modernize and enhance the Moodle Grading Program to empower educators 
                with a faster, more efficient, and user-friendly grading experience. Originally developed 
                by Calvin students, this tool has served as a cornerstone for streamlining the grading 
                process. However, our vision goes beyond incremental improvements: we aim to revolutionize 
                the way grading is conducted by addressing critical inefficiencies and introducing 
                innovative features.
              </p>
              <p className="text-gray-300 text-xl leading-relaxed">
                At the heart of our project lies a commitment to usability, efficiency, and error 
                prevention. By transitioning from Angular to React, we're building a robust foundation 
                for smoother operations and future enhancements. Features such as automatic feedback 
                ordering, session timers, and intelligent feedback tools will redefine grading 
                consistency and accuracy.
              </p>
            </CardContent>
          </Card>

          {/* Team Information */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-3xl">Our Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="space-y-3">
                  <h3 className="font-semibold text-white text-2xl">Prince Padi</h3>
                  <p className="text-gray-400 text-xl">
                    Final year student from Ghana and Atlanta studying computer science
                  </p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-white text-2xl">Haneum Cha</h3>
                  <p className="text-gray-400 text-xl">
                    Final year student from Korea studying computer science in Calvin University
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Project Report */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-3xl">Project Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-300 text-xl">
                  The problems we encountered when we first investigate the original project were:
                </p>
                <ul className="list-disc pl-8 space-y-3 text-gray-300 text-xl">
                  <li>Inefficient submission transfer</li>
                  <li>Lack of default comments</li>
                  <li>Unordered feedback list</li>
                  <li>No automatic saving</li>
                </ul>
                <p className="text-gray-300 text-xl">
                  During this semester, we successfully:
                </p>
                <ul className="list-disc pl-8 space-y-3 text-gray-300 text-xl">
                  <li>Added default comments and feedback ordering feature</li>
                  <li>Implemented original Angular project to React, with full functionalities</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Links Section */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-3xl">Important Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <a 
                  href="https://calvin.edu/academics/school-stem/computer-science"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xl"
                >
                  <Link size={20} />
                  Calvin University Computer Science Department
                </a>
                <a 
                  href="https://pnp3.github.io/MoodleGradingApp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xl"
                >
                  <Link size={20} />
                  Project Demo
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;