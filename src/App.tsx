import React, { useState, useRef, useEffect } from 'react';
// html2canvas and jsPDF are expected to be loaded via CDN in the HTML environment,
// so direct imports are removed to resolve compilation errors.
// They will be accessed as global variables (html2canvas, jsPDF).

// Type declarations for global variables
declare global {
    interface Window {
        html2canvas: any;
        jsPDF: any;
    }
}

// Define interfaces for our data structures
interface MeetingMinute {
    id: number;
    title: string;
    date: string;
    time: string;
    attendees: string;
    agenda: string;
    discussion: string;
    actionItems: string;
    nextMeeting: string;
}

interface Task {
    id: number;
    description: string;
    taskStartDate: string;
    taskEndDate: string;
    status: 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';
    assignedTo: string;
}

interface ProjectSchedule {
    id: number;
    projectName: string;
    startDate: string;
    endDate: string;
    tasks: Task[];
}

// Main App Component
const App = () => {
    // State to manage the currently active tab (MoM or Project Schedule)
    const [activeTab, setActiveTab] = useState('mom');
    // State to store Minutes of Meeting data
    const [momData, setMomData] = useState<MeetingMinute[]>([]);
    // State to store Project Schedule data
    const [projectScheduleData, setProjectScheduleData] = useState<ProjectSchedule[]>([]);
    // State to manage temporary success messages for downloads/emails
    const [message, setMessage] = useState('');

    // Refs to target the content areas for PDF generation
    const momContentRef = useRef<HTMLDivElement>(null);
    const projectScheduleContentRef = useRef<HTMLDivElement>(null);

    // Effect to clear messages after a short delay
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage('');
            }, 3000); // Message disappears after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [message]);

    // Function to handle adding new Minutes of Meeting
    const handleAddMom = (newMom: Omit<MeetingMinute, 'id'>) => {
        setMomData(prev => [...prev, { ...newMom, id: Date.now() }]);
        setMessage('Minutes added successfully!');
    };

    // Function to handle adding new Project Schedule
    const handleAddProjectSchedule = (newSchedule: Omit<ProjectSchedule, 'id'>) => {
        setProjectScheduleData(prev => [...prev, { ...newSchedule, id: Date.now() }]);
        setMessage('Project schedule added successfully!');
    };

    // Function to generate and download PDF
    const downloadPdf = async (contentRef: React.RefObject<HTMLDivElement>, filename: string) => {
        if (!contentRef.current) {
            setMessage('Error: Content not found for PDF generation.');
            return;
        }
        
        // Debug: Log what's available in window object
        console.log('=== PDF Generation Debug ===');
        console.log('window.html2canvas:', typeof window.html2canvas);
        console.log('window.jsPDF:', typeof window.jsPDF);
        console.log('window.jspdf:', typeof (window as any).jspdf);
        console.log('window.jsPDF object:', window.jsPDF);
        
        // Check if html2canvas is available
        if (typeof window.html2canvas === 'undefined') {
            setMessage('Error: html2canvas library is not loaded.');
            console.error('html2canvas not found');
            return;
        }
        
        // More comprehensive jsPDF detection
        let jsPDFConstructor = null;
        
        // Method 1: Check if window.jsPDF is a constructor function
        if (typeof window.jsPDF === 'function') {
            jsPDFConstructor = window.jsPDF;
            console.log('Using window.jsPDF directly');
        }
        // Method 2: Check if window.jsPDF.jsPDF exists
        else if (window.jsPDF && typeof window.jsPDF.jsPDF === 'function') {
            jsPDFConstructor = window.jsPDF.jsPDF;
            console.log('Using window.jsPDF.jsPDF');
        }
        // Method 3: Check if window.jsPDF.default exists
        else if (window.jsPDF && typeof window.jsPDF.default === 'function') {
            jsPDFConstructor = window.jsPDF.default;
            console.log('Using window.jsPDF.default');
        }
        // Method 4: Check global jspdf variable
        else if (typeof (window as any).jspdf === 'object' && (window as any).jspdf.jsPDF) {
            jsPDFConstructor = (window as any).jspdf.jsPDF;
            console.log('Using window.jspdf.jsPDF');
        }
        
        if (!jsPDFConstructor) {
            setMessage('Error: jsPDF library is not loaded or not accessible.');
            console.error('jsPDF constructor not found. Available window properties:', Object.keys(window).filter(key => key.toLowerCase().includes('jspdf') || key.toLowerCase().includes('pdf')));
            return;
        }

        setMessage('Generating PDF...');
        try {
            // Use html2canvas to capture the content as an image
            const canvas = await window.html2canvas(contentRef.current, {
                scale: 2,
                useCORS: true,
                windowWidth: contentRef.current.scrollWidth,
                windowHeight: contentRef.current.scrollHeight
            });

            const imgData = canvas.toDataURL('image/png');
            
            // Create PDF instance
            console.log('Creating PDF with constructor:', jsPDFConstructor);
            const pdf = new jsPDFConstructor('p', 'mm', 'a4');
            
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            // Add the image to the PDF, handling multiple pages if content is long
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${filename}.pdf`);
            setMessage(`${filename}.pdf downloaded successfully!`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            setMessage(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Function to handle email sending (opens mailto link)
    const sendEmail = (content: MeetingMinute[] | ProjectSchedule[] | string, subject: string, filename: string) => {
        // Basic plain text representation of the content
        let emailBody = `${subject}\n\n`;
        if (typeof content === 'string') {
            emailBody += content;
        } else if (Array.isArray(content)) {
            content.forEach(item => {
                for (const key in item) {
                    if (key !== 'id' && item[key as keyof typeof item]) {
                        // Format key names for readability in email
                        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                        emailBody += `${formattedKey}: ${item[key as keyof typeof item]}\n`;
                    }
                }
                emailBody += '\n---\n\n'; // Separator for multiple entries
            });
        }

        // Encode the subject and body for the mailto link
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
        window.open(mailtoLink, '_blank'); // Open in a new tab
        setMessage(`Email client opened for ${filename}.`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-inter text-gray-800 p-4 sm:p-6 lg:p-8 rounded-lg shadow-xl">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                body {
                    font-family: 'Inter', sans-serif;
                }
                .scrollable-content {
                    max-height: 500px; /* Adjust as needed */
                    overflow-y: auto;
                    border: 1px solid #e2e8f0; /* Light gray border */
                    border-radius: 0.5rem; /* Rounded corners */
                    padding: 1rem;
                    background-color: #fff;
                    box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06); /* subtle inner shadow */
                }
                /* Hide scrollbar for Chrome, Safari and Opera */
                .scrollable-content::-webkit-scrollbar {
                    display: none;
                }
                /* Hide scrollbar for IE, Edge and Firefox */
                .scrollable-content {
                    -ms-overflow-style: none;  /* IE and Edge */
                    scrollbar-width: none;  /* Firefox */
                }
                `}
            </style>
            <header className="text-center mb-8">
                <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-800 mb-2 drop-shadow-lg">
                    TaskFlow Canvas
                </h1>
                <p className="text-lg text-gray-600">
                    Your Project Assistant Toolkit
                </p>
            </header>

            {/* Message Display */}
            {message && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-6 shadow-md transition-all duration-300 ease-in-out transform scale-100 opacity-100">
                    <p className="font-semibold">{message}</p>
                </div>
            )}

            {/* Tab Navigation */}
            <nav className="mb-8 flex justify-center space-x-4">
                <button
                    onClick={() => setActiveTab('mom')}
                    className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ease-in-out shadow-md
                        ${activeTab === 'mom' ? 'bg-blue-600 text-white transform scale-105 shadow-lg' : 'bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800'}`
                    }
                >
                    Notes of Meeting
                </button>
                <button
                    onClick={() => setActiveTab('project')}
                    className={`px-6 py-3 rounded-xl font-semibold text-lg transition-all duration-300 ease-in-out shadow-md
                        ${activeTab === 'project' ? 'bg-blue-600 text-white transform scale-105 shadow-lg' : 'bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800'}`
                    }
                >
                    Project Schedule
                </button>
            </nav>

            {/* Conditional Rendering based on active tab */}
            {activeTab === 'mom' && (
                <MinutesOfMeeting
                    onAddMom={handleAddMom}
                    momData={momData}
                    momContentRef={momContentRef}
                    downloadPdf={() => downloadPdf(momContentRef, 'MeetingMinutes')}
                    sendEmail={() => sendEmail(momData, 'Notes of Meeting', 'MeetingMinutes')}
                />
            )}

            {activeTab === 'project' && (
                <ProjectScheduleComponent
                    onAddProjectSchedule={handleAddProjectSchedule}
                    projectScheduleData={projectScheduleData}
                    projectScheduleContentRef={projectScheduleContentRef}
                    downloadPdf={() => downloadPdf(projectScheduleContentRef, 'ProjectSchedule')}
                    sendEmail={() => sendEmail(projectScheduleData, 'Project Schedule', 'ProjectSchedule')}
                />
            )}
        </div>
    );
};

// MinutesOfMeeting Component
interface MinutesOfMeetingProps {
    onAddMom: (newMom: Omit<MeetingMinute, 'id'>) => void;
    momData: MeetingMinute[];
    momContentRef: React.RefObject<HTMLDivElement>;
    downloadPdf: () => void;
    sendEmail: (content: MeetingMinute[], subject: string, filename: string) => void;
}

const MinutesOfMeeting: React.FC<MinutesOfMeetingProps> = ({ onAddMom, momData, momContentRef, downloadPdf, sendEmail }) => {
    // State for MoM form fields
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [attendees, setAttendees] = useState('');
    const [agenda, setAgenda] = useState('');
    const [discussion, setDiscussion] = useState('');
    const [actionItems, setActionItems] = useState('');
    const [nextMeeting, setNextMeeting] = useState('');

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddMom({
            title, date, time, attendees, agenda, discussion, actionItems, nextMeeting
        });
        // Clear form fields after submission
        setTitle(''); setDate(''); setTime(''); setAttendees('');
        setAgenda(''); setDiscussion(''); setActionItems(''); setNextMeeting('');
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">New Notes of Meeting</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Input fields for Minutes of Meeting */}
                <InputField label="Date" type="date" value={date} onChange={setDate} required />
                <InputField label="Time" type="time" value={time} onChange={setTime} required />
                <InputField label="Meeting Title" type="text" value={title} onChange={setTitle} required />
                <InputField label="Attendees" type="text" value={attendees} onChange={setAttendees} placeholder="e.g., John Doe, Jane Smith" />
                <TextareaField label="Agenda" value={agenda} onChange={setAgenda} rows={3} placeholder="Key topics to discuss..." />
                <TextareaField label="Discussion Points" value={discussion} onChange={setDiscussion} rows={5} placeholder="Summary of discussions and decisions..." />
                <TextareaField label="Action Items" value={actionItems} onChange={setActionItems} rows={4} placeholder="Tasks, owners, and due dates..." />
                <InputField label="Next Meeting Date" type="date" value={nextMeeting} onChange={setNextMeeting} />

                <div className="md:col-span-2 flex justify-center">
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Add Minutes
                    </button>
                </div>
            </form>

            <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">Recorded Minutes</h2>
            {momData.length === 0 ? (
                <p className="text-center text-gray-600 p-4 border rounded-lg bg-gray-50">No minutes recorded yet. Add some above!</p>
            ) : (
                <div ref={momContentRef} className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200 scrollable-content mb-6">
                    {momData.map((mom, index) => (
                        <div key={mom.id} className="mb-6 pb-6 border-b border-gray-300 last:border-b-0 last:pb-0">
                            <h3 className="text-xl font-semibold text-blue-800 mb-2">{mom.title || `Meeting ${index + 1}`}</h3>
                            <p className="text-gray-700 mb-1"><strong>Date:</strong> {mom.date} at {mom.time}</p>
                            {mom.attendees && <p className="text-gray-700 mb-1"><strong>Attendees:</strong> {mom.attendees}</p>}
                            {mom.agenda && <p className="text-gray-700 mb-1"><strong>Agenda:</strong> {mom.agenda}</p>}
                            {mom.discussion && <p className="text-gray-700 mb-1"><strong>Discussion:</strong> {mom.discussion}</p>}
                            {mom.actionItems && <p className="text-gray-700 mb-1"><strong>Action Items:</strong> {mom.actionItems}</p>}
                            {mom.nextMeeting && <p className="text-gray-700"><strong>Next Meeting:</strong> {mom.nextMeeting}</p>}
                        </div>
                    ))}
                </div>
            )}
            
            {/* Always show buttons, but disable when no data */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                <ActionButton
                    onClick={momData.length > 0 ? downloadPdf : () => alert('Please add notes of meeting first')}
                    label="Download PDF"
                    icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    color="green"
                />
                <ActionButton
                    onClick={momData.length > 0 ? () => sendEmail(momData, 'Notes of Meeting', 'MeetingMinutes') : () => alert('Please add notes of meeting first')}
                    label="Email Minutes"
                    icon="M3 8l4 4 4-4m0 6l-4 4-4-4"
                    color="orange"
                />
            </div>
        </div>
    );
};

// ProjectSchedule Component
interface ProjectScheduleProps {
    onAddProjectSchedule: (newSchedule: Omit<ProjectSchedule, 'id'>) => void;
    projectScheduleData: ProjectSchedule[];
    projectScheduleContentRef: React.RefObject<HTMLDivElement>;
    downloadPdf: () => void;
    sendEmail: (content: ProjectSchedule[], subject: string, filename: string) => void;
}

const ProjectScheduleComponent: React.FC<ProjectScheduleProps> = ({ onAddProjectSchedule, projectScheduleData, projectScheduleContentRef, downloadPdf, sendEmail }) => {
    // State for Project Schedule form fields
    const [projectName, setProjectName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    // State for managing multiple tasks
    const [tasks, setTasks] = useState<Task[]>([
        { id: 1, description: '', taskStartDate: '', taskEndDate: '', status: 'Not Started', assignedTo: '' }
    ]);

    // Handle adding a new task row
    const addTask = () => {
        setTasks(prev => [...prev, { id: Date.now(), description: '', taskStartDate: '', taskEndDate: '', status: 'Not Started', assignedTo: '' }]);
    };

    // Handle updating a specific task field
    const handleTaskChange = (id: number, field: keyof Task, value: string) => {
        setTasks(prev => prev.map(task =>
            task.id === id ? { ...task, [field]: value } : task
        ));
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddProjectSchedule({
            projectName, startDate, endDate, tasks
        });
        // Clear form fields and reset tasks after submission
        setProjectName(''); setStartDate(''); setEndDate('');
        setTasks([{ id: 1, description: '', taskStartDate: '', taskEndDate: '', status: 'Not Started', assignedTo: '' }]);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">New Project Schedule</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Input fields for Project Schedule */}
                <InputField label="Project Name" type="text" value={projectName} onChange={setProjectName} required />
                <InputField label="Start Date" type="date" value={startDate} onChange={setStartDate} required />
                <InputField label="End Date" type="date" value={endDate} onChange={setEndDate} required />

                <div className="md:col-span-2 mt-4">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Tasks</h3>
                    {tasks.map((task, index) => (
                        <div key={task.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                            <div className="lg:col-span-2">
                                <InputField
                                    label={`Task ${index + 1} Description`}
                                    type="text"
                                    value={task.description}
                                    onChange={(val: string) => handleTaskChange(task.id, 'description', val)}
                                    placeholder="e.g., Design UI"
                                    required
                                />
                            </div>
                            <InputField
                                label="Start Date"
                                type="date"
                                value={task.taskStartDate}
                                onChange={(val: string) => handleTaskChange(task.id, 'taskStartDate', val)}
                            />
                            <InputField
                                label="End Date"
                                type="date"
                                value={task.taskEndDate}
                                onChange={(val: string) => handleTaskChange(task.id, 'taskEndDate', val)}
                            />
                            <select
                                className="mt-7 p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                value={task.status}
                                onChange={(e) => handleTaskChange(task.id, 'status', e.target.value)}
                            >
                                <option value="Not Started">Not Started</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                                <option value="Blocked">Blocked</option>
                            </select>
                            <InputField
                                label="Assigned To"
                                type="text"
                                value={task.assignedTo}
                                onChange={(val: string) => handleTaskChange(task.id, 'assignedTo', val)}
                                placeholder="e.g., Alice"
                            />
                        </div>
                    ))}
                    <div className="flex justify-center mt-4">
                        <button
                            type="button"
                            onClick={addTask}
                            className="bg-green-500 text-white px-6 py-2 rounded-full font-semibold shadow-md hover:bg-green-600 transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Add Another Task
                        </button>
                    </div>
                </div>

                <div className="md:col-span-2 flex justify-center mt-6">
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Add Schedule
                    </button>
                </div>
            </form>

            <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">Recorded Schedules</h2>
            {projectScheduleData.length === 0 ? (
                <p className="text-center text-gray-600 p-4 border rounded-lg bg-gray-50">No schedules recorded yet. Add some above!</p>
            ) : (
                <>
                    <div ref={projectScheduleContentRef} className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200 scrollable-content mb-6">
                        {projectScheduleData.map((schedule, index) => (
                            <div key={schedule.id} className="mb-6 pb-6 border-b border-gray-300 last:border-b-0 last:pb-0">
                                <h3 className="text-xl font-semibold text-blue-800 mb-2">{schedule.projectName || `Project ${index + 1}`}</h3>
                                <p className="text-gray-700 mb-1"><strong>Duration:</strong> {schedule.startDate} to {schedule.endDate}</p>
                                <h4 className="text-lg font-medium text-gray-700 mt-4 mb-2">Tasks:</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
                                        <thead className="bg-blue-100">
                                            <tr>
                                                <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider rounded-tl-lg">Description</th>
                                                <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Start Date</th>
                                                <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">End Date</th>
                                                <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider">Status</th>
                                                <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider rounded-tr-lg">Assigned To</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {schedule.tasks.map(task => (
                                                <tr key={task.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                                                    <td className="py-2 px-4 text-sm text-gray-800">{task.description}</td>
                                                    <td className="py-2 px-4 text-sm text-gray-800">{task.taskStartDate}</td>
                                                    <td className="py-2 px-4 text-sm text-gray-800">{task.taskEndDate}</td>
                                                    <td className="py-2 px-4 text-sm text-gray-800">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                                            ${task.status === 'Completed' ? 'bg-green-200 text-green-800' :
                                                            task.status === 'In Progress' ? 'bg-yellow-200 text-yellow-800' :
                                                            task.status === 'Blocked' ? 'bg-red-200 text-red-800' :
                                                            'bg-gray-200 text-gray-800'}`
                                                        }>
                                                            {task.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-4 text-sm text-gray-800">{task.assignedTo}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                        <ActionButton
                            onClick={downloadPdf}
                            label="Download PDF"
                            icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" // Download icon
                            color="teal"
                        />
                        <ActionButton
                            onClick={() => sendEmail(projectScheduleData, 'Project Schedule', 'ProjectSchedule')}
                            label="Email Schedule"
                            icon="M13 14l-4-4m0 0l-4 4m4-4v12" // Email icon (simplified, could be mail envelope)
                            color="pink"
                        />
                    </div>
                </>
            )}
            
            {/* Always show buttons when no data, but show alert */}
            {projectScheduleData.length === 0 && (
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                    <ActionButton
                        onClick={() => alert('Please add project schedules first')}
                        label="Download PDF"
                        icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        color="orange"
                    />
                    <ActionButton
                        onClick={() => alert('Please add project schedules first')}
                        label="Email Schedule"
                        icon="M3 8l4 4 4-4m0 6l-4 4-4-4"
                        color="pink"
                    />
                </div>
            )}
        </div>
    );
};

// Reusable Input Field Component
interface InputFieldProps {
    label: string;
    type: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    placeholder?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, type, value, onChange, required = false, placeholder = '' }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required={required}
            placeholder={placeholder}
        />
    </div>
);

// Reusable Textarea Field Component
interface TextareaFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    rows: number;
    placeholder?: string;
}

const TextareaField: React.FC<TextareaFieldProps> = ({ label, value, onChange, rows, placeholder = '' }) => (
    <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            placeholder={placeholder}
        ></textarea>
    </div>
);

// Reusable Action Button Component
interface ActionButtonProps {
    onClick: () => void;
    label: string;
    icon: string;
    color: 'blue' | 'purple' | 'green' | 'red' | 'orange' | 'pink' | 'indigo' | 'teal';
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, label, icon, color }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center px-6 py-3 rounded-full font-semibold text-lg transition duration-300 ease-in-out transform hover:scale-105 shadow-md
            ${color === 'blue' ? 'bg-blue-500 text-white hover:bg-blue-600' :
              color === 'purple' ? 'bg-purple-500 text-white hover:bg-purple-600' :
              color === 'green' ? 'bg-green-500 text-white hover:bg-green-600' :
              color === 'red' ? 'bg-red-500 text-white hover:bg-red-600' :
              color === 'orange' ? 'bg-orange-500 text-white hover:bg-orange-600' :
              color === 'pink' ? 'bg-pink-500 text-white hover:bg-pink-600' :
              color === 'indigo' ? 'bg-indigo-500 text-white hover:bg-indigo-600' :
              color === 'teal' ? 'bg-teal-500 text-white hover:bg-teal-600' :
              'bg-gray-500 text-white hover:bg-gray-600'}`
        }
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
        {label}
    </button>
);

export default App;
