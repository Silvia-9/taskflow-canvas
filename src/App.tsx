import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
// html2canvas and jsPDF are expected to be loaded via CDN in the HTML environment,
// so direct imports are removed to resolve compilation errors.
// They will be accessed as global variables (html2canvas, jsPDF).

// Type declarations for global variables
declare global {
    interface Window {
        html2canvas: any;
        jsPDF: any;
        gtag?: (...args: any[]) => void;
    }
}

// Define interfaces for our data structures
interface ActionItem {
    id: number;
    task: string;
    owner: string;
    dueDate: string;
}

interface MeetingMinute {
    id: number;
    title: string;
    date: string;
    time: string;
    attendees: string;
    agenda: string;
    discussion: string;
    actionItems: ActionItem[];
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

interface TaskCard {
    id: number;
    title: string;
    description: string;
    assignedTo: string;
    priority: 'Low' | 'Medium' | 'High';
    status: 'Not Started' | 'In Progress' | 'Review' | 'Done';
    dueDate: string;
    tags: string[];
}

interface BudgetItem {
    id: number;
    category: string;
    description: string;
    estimatedCost: number;
    actualCost: number;
    earnedValue: number;
    notes: string;
}

interface ProjectBudget {
    id: number;
    projectName: string;
    totalBudget: number;
    items: BudgetItem[];
}

interface Risk {
    id: number;
    riskDescription: string;
    probability: 'Low' | 'Medium' | 'High';
    impact: 'Low' | 'Medium' | 'High';
    category: string;
    mitigation: string;
    owner: string;
    status: 'Open' | 'Mitigated' | 'Closed';
}

interface RiskRegister {
    id: number;
    projectName: string;
    risks: Risk[];
}

// Main App Component
const App = () => {
    // State to manage the currently active tab
    const [activeTab, setActiveTab] = useState('mom');
    
    // Function to track section views in Google Analytics
    const trackSectionView = (sectionName: string) => {
        // Track page view for specific section
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'page_view', {
                page_title: `TaskFlow Canvas - ${sectionName}`,
                page_location: `${window.location.origin}${window.location.pathname}#${sectionName.toLowerCase().replace(' ', '-')}`,
                custom_parameter_1: sectionName
            });
            
            // Track custom event for section engagement
            window.gtag('event', 'section_view', {
                event_category: 'Navigation',
                event_label: sectionName,
                custom_parameter_1: 'tab_navigation'
            });
        }
    };
    
    // Enhanced function to handle tab changes with analytics
    const handleTabChange = (tabName: string, sectionLabel: string) => {
        setActiveTab(tabName);
        trackSectionView(sectionLabel);
    };
    // State to store Minutes of Meeting data
    const [momData, setMomData] = useState<MeetingMinute[]>([]);
    // State to store Timeline data
    const [projectScheduleData, setProjectScheduleData] = useState<ProjectSchedule[]>([]);
    // State to store Task Board data
    const [taskBoardData, setTaskBoardData] = useState<TaskCard[]>([]);
    // State to store Budget data
    const [budgetData, setBudgetData] = useState<ProjectBudget[]>([]);
    // State to store Risk Register data
    const [riskRegisterData, setRiskRegisterData] = useState<RiskRegister[]>([]);
    // State to manage temporary success messages for downloads/emails
    const [message, setMessage] = useState('');

    // Refs to target the content areas for PDF generation
    const momContentRef = useRef<HTMLDivElement>(null);
    const projectScheduleContentRef = useRef<HTMLDivElement>(null);
    const taskBoardContentRef = useRef<HTMLDivElement>(null);
    const budgetContentRef = useRef<HTMLDivElement>(null);
    const riskRegisterContentRef = useRef<HTMLDivElement>(null);

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
        setMessage('The meeting note has been successfully added!');
        
        // Track user engagement
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'item_created', {
                event_category: 'User Engagement',
                event_label: 'Meeting Notes',
                custom_parameter_1: 'content_creation'
            });
        }
    };

    // Function to handle adding new Timeline
    const handleAddProjectSchedule = (newSchedule: Omit<ProjectSchedule, 'id'>) => {
        setProjectScheduleData(prev => [...prev, { ...newSchedule, id: Date.now() }]);
        setMessage('The project schedule has been successfully updated!');
        
        // Track user engagement
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'item_created', {
                event_category: 'User Engagement',
                event_label: 'Gantt Chart',
                custom_parameter_1: 'content_creation'
            });
        }
    };

    // Function to handle adding new Task
    const handleAddTask = (newTask: Omit<TaskCard, 'id'>) => {
        setTaskBoardData(prev => [...prev, { ...newTask, id: Date.now() }]);
        setMessage('The task has been successfully added!');
        
        // Track user engagement
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'item_created', {
                event_category: 'User Engagement',
                event_label: 'Kanban Board',
                custom_parameter_1: 'content_creation'
            });
        }
    };

    // Function to handle updating task status
    const handleUpdateTaskStatus = (taskId: number, newStatus: TaskCard['status']) => {
        setTaskBoardData(prev => prev.map(task => 
            task.id === taskId ? { ...task, status: newStatus } : task
        ));
        setMessage('The task status has been successfully updated!');
    };

    // Function to handle adding new Budget
    const handleAddBudget = (newBudget: Omit<ProjectBudget, 'id'>) => {
        setBudgetData(prev => [...prev, { ...newBudget, id: Date.now() }]);
        setMessage('The budget has been successfully added!');

        // Track user engagement
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'item_created', {
                event_category: 'User Engagement',
                event_label: 'Budget Calculator',
                custom_parameter_1: 'content_creation'
            });
        }
    };

    // Function to handle adding new Risk Register
    const handleAddRiskRegister = (newRiskRegister: Omit<RiskRegister, 'id'>) => {
        setRiskRegisterData(prev => [...prev, { ...newRiskRegister, id: Date.now() }]);
        setMessage('The risk register has been successfully added!');
        
        // Track user engagement
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'item_created', {
                event_category: 'User Engagement',
                event_label: 'Risk Log',
                custom_parameter_1: 'content_creation'
            });
        }
    };

    // Delete handler functions
    const handleDeleteMom = (id: number) => {
        setMomData(prev => prev.filter(mom => mom.id !== id));
        setMessage('The meeting note has been successfully deleted!');
    };

    const handleDeleteProjectSchedule = (id: number) => {
        setProjectScheduleData(prev => prev.filter(schedule => schedule.id !== id));
        setMessage('The project schedule has been successfully deleted!');
    };

    const handleDeleteTask = (id: number) => {
        setTaskBoardData(prev => prev.filter(task => task.id !== id));
        setMessage('The task has been successfully deleted!');
    };

    const handleDeleteBudget = (id: number) => {
        setBudgetData(prev => prev.filter(budget => budget.id !== id));
        setMessage('The budget has been successfully deleted!');
    };

    const handleDeleteRiskRegister = (id: number) => {
        setRiskRegisterData(prev => prev.filter(register => register.id !== id));
        setMessage('The risk register has been successfully deleted!');
    };

    // Function to generate and download PDF with unified text-based format
    const downloadPdf = async (contentRef: React.RefObject<HTMLDivElement>, filename: string) => {
        setMessage('Generating PDF...');
        
        // Track PDF download attempt
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'file_download', {
                event_category: 'Downloads',
                event_label: `PDF - ${filename}`,
                file_extension: 'pdf',
                custom_parameter_1: 'pdf_generation'
            });
        }
        
        try {
            // Use unified text-based PDF generation for all sections
            await generateTextBasedPDF(filename, contentRef);
            
            // Track successful PDF generation
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'download_complete', {
                    event_category: 'Downloads',
                    event_label: `PDF Success - ${filename}`,
                    custom_parameter_1: 'pdf_success'
                });
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            setMessage(`❌ Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            // Track PDF generation failure
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'download_error', {
                    event_category: 'Errors',
                    event_label: `PDF Error - ${filename}`,
                    custom_parameter_1: 'pdf_error'
                });
            }
        }
    };

    // Fallback text-based PDF generation when html2canvas fails
    const generateTextBasedPDF = async (filename: string, contentRef: React.RefObject<HTMLDivElement>) => {
        try {
            // Get jsPDF constructor
            let jsPDFConstructor = null;
            if (typeof window.jsPDF === 'function') {
                jsPDFConstructor = window.jsPDF;
            } else if (window.jsPDF && typeof window.jsPDF.jsPDF === 'function') {
                jsPDFConstructor = window.jsPDF.jsPDF;
            } else if (window.jsPDF && typeof window.jsPDF.default === 'function') {
                jsPDFConstructor = window.jsPDF.default;
            } else if (typeof (window as any).jspdf === 'object' && (window as any).jspdf.jsPDF) {
                jsPDFConstructor = (window as any).jspdf.jsPDF;
            }
            
            if (!jsPDFConstructor) {
                setMessage('❌ Error: jsPDF library is not loaded for fallback generation.');
                return;
            }

            const currentDate = new Date().toISOString().split('T')[0];
            const filenameWithDate = `${filename}_${currentDate}`;
            
            const pdf = new jsPDFConstructor('p', 'mm', 'a4');
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 15;
            const lineHeight = 6;
            let yPosition = margin;
            
            // Helper function to add text with word wrapping
            const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
                pdf.setFontSize(fontSize);
                const lines = pdf.splitTextToSize(text, maxWidth);
                lines.forEach((line: string, index: number) => {
                    if (y + (index * lineHeight) > pageHeight - margin) {
                        pdf.addPage();
                        y = margin;
                    }
                    pdf.text(line, x, y + (index * lineHeight));
                });
                return y + (lines.length * lineHeight) + 3;
            };
            
            // Add header
            pdf.setFontSize(18);
            pdf.setTextColor(40, 116, 166);
            if (filename.includes('Timeline')) {
                pdf.text('PROJECT SCHEDULE REPORT', pageWidth / 2, yPosition, { align: 'center' });
            } else if (filename.includes('MeetingMinutes')) {
                pdf.text('MEETING REPORT', pageWidth / 2, yPosition, { align: 'center' });
            } else if (filename.includes('TaskBoard')) {
                pdf.text('KANBAN BOARD REPORT', pageWidth / 2, yPosition, { align: 'center' });
            } else if (filename.includes('Budget')) {
                pdf.text('PROJECT BUDGET REPORT', pageWidth / 2, yPosition, { align: 'center' });
            } else if (filename.includes('Risk')) {
                pdf.text('RISK REGISTER REPORT', pageWidth / 2, yPosition, { align: 'center' });
            } else {
                pdf.text('PROJECT REPORT', pageWidth / 2, yPosition, { align: 'center' });
            }
            
            yPosition += 10;
            
            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
            
            yPosition += 15;
            pdf.setTextColor(0, 0, 0);
            
            // Add content based on data type
            if (filename.includes('Timeline') && projectScheduleData.length > 0) {
                projectScheduleData.forEach((schedule, index) => {
                    if (yPosition > pageHeight - 50) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    
                    // Project header
                    pdf.setFontSize(14);
                    pdf.setTextColor(40, 116, 166);
                    yPosition = addWrappedText(`Project: ${schedule.projectName || `Project ${index + 1}`}`, margin, yPosition, pageWidth - 2 * margin, 14);
                    
                    pdf.setFontSize(10);
                    pdf.setTextColor(0, 0, 0);
                    yPosition = addWrappedText(`Duration: ${schedule.startDate} to ${schedule.endDate}`, margin, yPosition, pageWidth - 2 * margin);
                    
                    yPosition += 5;
                    
                    // Tasks
                    pdf.setFontSize(12);
                    pdf.setTextColor(0, 0, 0);
                    yPosition = addWrappedText('Tasks:', margin, yPosition, pageWidth - 2 * margin, 12);
                    
                    schedule.tasks.forEach((task, taskIndex) => {
                        if (yPosition > pageHeight - 30) {
                            pdf.addPage();
                            yPosition = margin;
                        }
                        
                        pdf.setFontSize(10);
                        yPosition = addWrappedText(`${taskIndex + 1}. ${task.description}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                        yPosition = addWrappedText(`   Start: ${task.taskStartDate} | End: ${task.taskEndDate}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                        yPosition = addWrappedText(`   Status: ${task.status} | Assigned: ${task.assignedTo}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                        yPosition += 3;
                    });
                    
                    yPosition += 10;
                });
            } else if (filename.includes('MeetingMinutes') && momData.length > 0) {
                momData.forEach((mom, index) => {
                    if (yPosition > pageHeight - 50) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    
                    pdf.setFontSize(14);
                    pdf.setTextColor(40, 116, 166);
                    yPosition = addWrappedText(`Meeting: ${mom.title}`, margin, yPosition, pageWidth - 2 * margin, 14);
                    
                    pdf.setFontSize(10);
                    pdf.setTextColor(0, 0, 0);
                    yPosition = addWrappedText(`Date: ${mom.date} | Time: ${mom.time}`, margin, yPosition, pageWidth - 2 * margin);
                    yPosition = addWrappedText(`Attendees: ${mom.attendees}`, margin, yPosition, pageWidth - 2 * margin);
                    yPosition = addWrappedText(`Agenda: ${mom.agenda}`, margin, yPosition, pageWidth - 2 * margin);
                    yPosition = addWrappedText(`Discussion: ${mom.discussion}`, margin, yPosition, pageWidth - 2 * margin);
                    
                    if (mom.actionItems.length > 0) {
                        yPosition += 3;
                        pdf.setFontSize(12);
                        yPosition = addWrappedText('Action Items:', margin, yPosition, pageWidth - 2 * margin, 12);
                        
                        mom.actionItems.forEach((item, itemIndex) => {
                            pdf.setFontSize(10);
                            yPosition = addWrappedText(`${itemIndex + 1}. ${item.task} (Owner: ${item.owner}, Due: ${item.dueDate})`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                        });
                    }
                    
                    yPosition = addWrappedText(`Next Meeting: ${mom.nextMeeting}`, margin, yPosition, pageWidth - 2 * margin);
                    yPosition += 10;
                });
            } else if (filename.includes('TaskBoard') && taskBoardData.length > 0) {
                // Group tasks by status for better organization
                const statusColumns = ['Not Started', 'In Progress', 'Review', 'Done'];
                
                statusColumns.forEach((status) => {
                    const tasksInStatus = taskBoardData.filter(task => task.status === status);
                    
                    if (tasksInStatus.length > 0) {
                        if (yPosition > pageHeight - 50) {
                            pdf.addPage();
                            yPosition = margin;
                        }
                        
                        // Status header
                        pdf.setFontSize(14);
                        pdf.setTextColor(40, 116, 166);
                        yPosition = addWrappedText(`${status} (${tasksInStatus.length} tasks)`, margin, yPosition, pageWidth - 2 * margin, 14);
                        yPosition += 5;
                        
                        tasksInStatus.forEach((task, taskIndex) => {
                            if (yPosition > pageHeight - 40) {
                                pdf.addPage();
                                yPosition = margin;
                            }
                            
                            pdf.setFontSize(12);
                            pdf.setTextColor(0, 0, 0);
                            yPosition = addWrappedText(`${taskIndex + 1}. ${task.title}`, margin + 10, yPosition, pageWidth - 2 * margin - 10, 12);
                            
                            pdf.setFontSize(10);
                            yPosition = addWrappedText(`   Description: ${task.description}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                            yPosition = addWrappedText(`   Assigned To: ${task.assignedTo}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                            yPosition = addWrappedText(`   Priority: ${task.priority} | Due Date: ${task.dueDate}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                            
                            if (task.tags && task.tags.length > 0) {
                                yPosition = addWrappedText(`   Category: ${task.tags.join(', ')}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                            }
                            
                            yPosition += 3;
                        });
                        
                        yPosition += 8;
                    }
                });
            } else if (filename.includes('Budget') && budgetData.length > 0) {
                budgetData.forEach((budget, index) => {
                    if (yPosition > pageHeight - 50) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    
                    // Project Budget Report Header
                    pdf.setFontSize(16);
                    pdf.setTextColor(40, 116, 166);
                    yPosition = addWrappedText(`PROJECT BUDGET REPORT`, margin, yPosition, pageWidth - 2 * margin, 16);
                    yPosition += 5;
                    
                    pdf.setFontSize(14);
                    pdf.setTextColor(0, 0, 0);
                    yPosition = addWrappedText(`Project: ${budget.projectName}`, margin, yPosition, pageWidth - 2 * margin, 14);
                    yPosition += 8;
                    
                    // Calculate totals and EVM metrics
                    const totalEstimated = budget.items.reduce((sum, item) => sum + item.estimatedCost, 0);
                    const totalActual = budget.items.reduce((sum, item) => sum + item.actualCost, 0);
                    const totalEarnedValue = budget.items.reduce((sum, item) => sum + item.earnedValue, 0);
                    const scheduleVariance = totalEarnedValue - totalEstimated;
                    const costVariance = totalEarnedValue - totalActual;
                    const spi = totalEstimated !== 0 ? (totalEarnedValue / totalEstimated) : 0;
                    const cpi = totalActual !== 0 ? (totalEarnedValue / totalActual) : 0;
                    const variance = totalActual - totalEstimated;
                    
                    // Budget Summary Section
                    pdf.setFontSize(13);
                    pdf.setTextColor(40, 116, 166);
                    yPosition = addWrappedText('BUDGET SUMMARY', margin, yPosition, pageWidth - 2 * margin, 13);
                    yPosition += 3;
                    
                    // Add underline for section
                    pdf.setDrawColor(40, 116, 166);
                    pdf.setLineWidth(0.5);
                    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
                    yPosition += 5;
                    
                    pdf.setFontSize(11);
                    pdf.setTextColor(0, 0, 0);
                    yPosition = addWrappedText(`Budget at Completion (BAC): $${budget.totalBudget.toLocaleString()}`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 11);
                    yPosition = addWrappedText(`Planned Value (PV): $${totalEstimated.toLocaleString()}`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 11);
                    yPosition = addWrappedText(`Earned Value (EV): $${totalEarnedValue.toLocaleString()}`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 11);
                    yPosition = addWrappedText(`Actual Cost (AC): $${totalActual.toLocaleString()}`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 11);
                    yPosition += 8;
                    
                    // EVM Metrics Section
                    pdf.setFontSize(13);
                    pdf.setTextColor(40, 116, 166);
                    yPosition = addWrappedText('EARNED VALUE MANAGEMENT (EVM) METRICS', margin, yPosition, pageWidth - 2 * margin, 13);
                    yPosition += 3;
                    
                    // Add underline for section
                    pdf.setDrawColor(40, 116, 166);
                    pdf.setLineWidth(0.5);
                    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
                    yPosition += 5;
                    
                    // Variance Metrics
                    pdf.setFontSize(12);
                    pdf.setTextColor(70, 70, 70);
                    yPosition = addWrappedText('Variance Analysis:', margin + 5, yPosition, pageWidth - 2 * margin - 5, 12);
                    
                    pdf.setFontSize(10);
                    pdf.setTextColor(0, 0, 0);
                    yPosition = addWrappedText(`• Schedule Variance (SV): $${scheduleVariance.toLocaleString()} ${scheduleVariance >= 0 ? '(Ahead of Schedule)' : '(Behind Schedule)'}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                    yPosition = addWrappedText(`• Cost Variance (CV): $${costVariance.toLocaleString()} ${costVariance >= 0 ? '(Under Budget)' : '(Over Budget)'}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                    yPosition += 3;
                    
                    // Performance Indices
                    pdf.setFontSize(12);
                    pdf.setTextColor(70, 70, 70);
                    yPosition = addWrappedText('Performance Indices:', margin + 5, yPosition, pageWidth - 2 * margin - 5, 12);
                    
                    pdf.setFontSize(10);
                    pdf.setTextColor(0, 0, 0);
                    yPosition = addWrappedText(`• Schedule Performance Index (SPI): ${spi.toFixed(3)} ${spi >= 1 ? '(On/Ahead Schedule)' : '(Behind Schedule)'}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                    yPosition = addWrappedText(`• Cost Performance Index (CPI): ${cpi.toFixed(3)} ${cpi >= 1 ? '(On/Under Budget)' : '(Over Budget)'}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                    yPosition += 8;
                    
                    // Project Status Summary
                    pdf.setFontSize(12);
                    pdf.setTextColor(70, 70, 70);
                    yPosition = addWrappedText('Project Status:', margin + 5, yPosition, pageWidth - 2 * margin - 5, 12);
                    
                    pdf.setFontSize(10);
                    pdf.setTextColor(0, 0, 0);
                    const projectStatus = (spi >= 1 && cpi >= 1) ? 'ON TRACK' : 
                                        (spi < 1 && cpi >= 1) ? 'BEHIND SCHEDULE' :
                                        (spi >= 1 && cpi < 1) ? 'OVER BUDGET' : 'CRITICAL - BEHIND SCHEDULE & OVER BUDGET';
                    yPosition = addWrappedText(`• Overall Status: ${projectStatus}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                    yPosition = addWrappedText(`• Budget Remaining: $${(budget.totalBudget - totalActual).toLocaleString()}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                    yPosition += 10;
                    
                    // Detailed Cost Categories Section
                    if (yPosition > pageHeight - 60) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    
                    pdf.setFontSize(13);
                    pdf.setTextColor(40, 116, 166);
                    yPosition = addWrappedText('DETAILED COST CATEGORIES BREAKDOWN', margin, yPosition, pageWidth - 2 * margin, 13);
                    yPosition += 3;
                    
                    // Add underline for section
                    pdf.setDrawColor(40, 116, 166);
                    pdf.setLineWidth(0.5);
                    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
                    yPosition += 5;
                    
                    budget.items.forEach((item, itemIndex) => {
                        if (yPosition > pageHeight - 45) {
                            pdf.addPage();
                            yPosition = margin;
                        }
                        
                        // Item header
                        pdf.setFontSize(11);
                        pdf.setTextColor(70, 70, 70);
                        yPosition = addWrappedText(`${itemIndex + 1}. ${item.category.toUpperCase()}`, margin + 5, yPosition, pageWidth - 2 * margin - 5, 11);
                        
                        pdf.setFontSize(10);
                        pdf.setTextColor(0, 0, 0);
                        yPosition = addWrappedText(`   Description: ${item.description}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                        
                        // Financial details in structured format
                        yPosition = addWrappedText(`   • Planned Value (PV): $${item.estimatedCost.toLocaleString()}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                        yPosition = addWrappedText(`   • Earned Value (EV): $${item.earnedValue.toLocaleString()}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                        yPosition = addWrappedText(`   • Actual Cost (AC): $${item.actualCost.toLocaleString()}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                        
                        // Item-level variance
                        const itemSV = item.earnedValue - item.estimatedCost;
                        const itemCV = item.earnedValue - item.actualCost;
                        yPosition = addWrappedText(`   • Schedule Variance: $${itemSV.toLocaleString()} ${itemSV >= 0 ? '(Ahead)' : '(Behind)'}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                        yPosition = addWrappedText(`   • Cost Variance: $${itemCV.toLocaleString()} ${itemCV >= 0 ? '(Under Budget)' : '(Over Budget)'}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                        
                        if (item.notes && item.notes.trim()) {
                            yPosition = addWrappedText(`   • Notes: ${item.notes}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                        }
                        
                        yPosition += 5;
                    });
                    
                    // Add footer section
                    yPosition += 5;
                    pdf.setFontSize(8);
                    pdf.setTextColor(100, 100, 100);
                    yPosition = addWrappedText(`Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, yPosition, pageWidth - 2 * margin, 8);
                    yPosition = addWrappedText(`Page ${pdf.internal.getNumberOfPages()} | TaskFlow Canvas Budget Report`, margin, yPosition, pageWidth - 2 * margin, 8);
                    
                    if (index < budgetData.length - 1) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                });
            } else if (filename.includes('Risk') && riskRegisterData.length > 0) {
                riskRegisterData.forEach((riskRegister, index) => {
                    if (yPosition > pageHeight - 50) {
                        pdf.addPage();
                        yPosition = margin;
                    }
                    
                    // Risk register header
                    pdf.setFontSize(14);
                    pdf.setTextColor(40, 116, 166);
                    yPosition = addWrappedText(`Project: ${riskRegister.projectName}`, margin, yPosition, pageWidth - 2 * margin, 14);
                    
                    pdf.setFontSize(12);
                    pdf.setTextColor(0, 0, 0);
                    yPosition = addWrappedText(`Total Risks: ${riskRegister.risks.length}`, margin, yPosition, pageWidth - 2 * margin, 12);
                    yPosition += 5;
                    
                    // Risk statistics
                    const riskStats = {
                        open: riskRegister.risks.filter(r => r.status === 'Open').length,
                        mitigated: riskRegister.risks.filter(r => r.status === 'Mitigated').length,
                        closed: riskRegister.risks.filter(r => r.status === 'Closed').length,
                        high: riskRegister.risks.filter(r => r.probability === 'High' || r.impact === 'High').length
                    };
                    
                    pdf.setFontSize(10);
                    yPosition = addWrappedText(`Open: ${riskStats.open} | Mitigated: ${riskStats.mitigated} | Closed: ${riskStats.closed}`, margin, yPosition, pageWidth - 2 * margin);
                    yPosition = addWrappedText(`High Priority Risks: ${riskStats.high}`, margin, yPosition, pageWidth - 2 * margin);
                    yPosition += 8;
                    
                    // Group risks by status
                    const riskStatuses = ['Open', 'Mitigated', 'Closed'];
                    
                    riskStatuses.forEach((status) => {
                        const risksInStatus = riskRegister.risks.filter(risk => risk.status === status);
                        
                        if (risksInStatus.length > 0) {
                            if (yPosition > pageHeight - 40) {
                                pdf.addPage();
                                yPosition = margin;
                            }
                            
                            pdf.setFontSize(12);
                            pdf.setTextColor(40, 116, 166);
                            yPosition = addWrappedText(`${status} Risks (${risksInStatus.length})`, margin, yPosition, pageWidth - 2 * margin, 12);
                            yPosition += 3;
                            
                            risksInStatus.forEach((risk, riskIndex) => {
                                if (yPosition > pageHeight - 35) {
                                    pdf.addPage();
                                    yPosition = margin;
                                }
                                
                                pdf.setFontSize(10);
                                pdf.setTextColor(0, 0, 0);
                                yPosition = addWrappedText(`${riskIndex + 1}. ${risk.riskDescription}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                                yPosition = addWrappedText(`   Category: ${risk.category} | Owner: ${risk.owner}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                                yPosition = addWrappedText(`   Probability: ${risk.probability} | Impact: ${risk.impact}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                                yPosition = addWrappedText(`   Mitigation: ${risk.mitigation}`, margin + 10, yPosition, pageWidth - 2 * margin - 10);
                                yPosition += 3;
                            });
                            
                            yPosition += 5;
                        }
                    });
                    
                    yPosition += 10;
                });
            } else {
                // Generic fallback for other types or empty data
                pdf.setFontSize(12);
                pdf.setTextColor(100, 100, 100);
                yPosition = addWrappedText('No data available for this section.', margin, yPosition, pageWidth - 2 * margin, 12);
                yPosition += 10;
                yPosition = addWrappedText('Content could not be captured automatically. Please check the application and try again.', margin, yPosition, pageWidth - 2 * margin);
                yPosition = addWrappedText('This is a fallback text-based PDF. For full visual content, please ensure your browser supports html2canvas.', margin, yPosition, pageWidth - 2 * margin);
            }
            
            pdf.save(`${filenameWithDate}.pdf`);
            setMessage(`📄 Fallback PDF generated successfully! File: ${filenameWithDate}.pdf`);
            
        } catch (error) {
            console.error('Error in fallback PDF generation:', error);
            setMessage(`❌ Failed to generate fallback PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    // Function to generate and download Excel file
    const downloadExcel = (data: MeetingMinute[] | ProjectSchedule[] | TaskCard[] | ProjectBudget[] | RiskRegister[], filename: string, sheetName: string) => {
        try {
            setMessage('Generating Excel file...');
            
            // Track Excel download attempt
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'file_download', {
                    event_category: 'Downloads',
                    event_label: `Excel - ${filename}`,
                    file_extension: 'xlsx',
                    custom_parameter_1: 'excel_generation'
                });
            }
            
            // Generate current date for filename
            const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
            const filenameWithDate = `${filename}_${currentDate}`;
            
            let worksheetData: any[] = [];
            
            if (data.length === 0) {
                setMessage('No data available for Excel export.');
                
                // Track Excel generation failure
                if (typeof window !== 'undefined' && window.gtag) {
                    window.gtag('event', 'download_error', {
                        event_category: 'Errors',
                        event_label: `Excel Error - ${filename} (No Data)`,
                        custom_parameter_1: 'excel_no_data'
                    });
                }
                return;
            }

            // Format data based on type
            if (filename.includes('MeetingMinutes')) {
                const momData = data as MeetingMinute[];
                worksheetData = momData.map(mom => ({
                    'Meeting Title': mom.title,
                    'Date': mom.date,
                    'Time': mom.time,
                    'Attendees': mom.attendees,
                    'Agenda': mom.agenda,
                    'Discussion': mom.discussion,
                    'Future Actions': mom.actionItems.map(item => `${item.task} (Owner: ${item.owner}, Due: ${item.dueDate})`).join('; '),
                    'Next Meeting': mom.nextMeeting
                }));
            } else if (filename.includes('ProjectSchedule') || filename.includes('ProjectTimeline')) {
                const scheduleData = data as ProjectSchedule[];
                worksheetData = [];
                scheduleData.forEach(schedule => {
                    schedule.tasks.forEach(task => {
                        worksheetData.push({
                            'Project Name': schedule.projectName,
                            'Project Start': schedule.startDate,
                            'Project End': schedule.endDate,
                            'Task Description': task.description,
                            'Task Start Date': task.taskStartDate,
                            'Task End Date': task.taskEndDate,
                            'Status': task.status,
                            'Assigned To': task.assignedTo
                        });
                    });
                });
            } else if (filename.includes('TaskBoard')) {
                const taskData = data as TaskCard[];
                worksheetData = taskData.map(task => ({
                    'Title': task.title,
                    'Description': task.description,
                    'Assigned To': task.assignedTo,
                    'Priority': task.priority,
                    'Status': task.status,
                    'Due Date': task.dueDate,
                    'Category': task.tags.join(', ')
                }));
            } else if (filename.includes('ProjectBudget')) {
                const budgetData = data as ProjectBudget[];
                worksheetData = [];
                budgetData.forEach(budget => {
                    // Calculate EVM metrics for the project
                    const totalPV = budget.items.reduce((sum, item) => sum + item.estimatedCost, 0);
                    const totalEV = budget.items.reduce((sum, item) => sum + item.earnedValue, 0);
                    const totalAC = budget.items.reduce((sum, item) => sum + item.actualCost, 0);
                    const scheduleVariance = totalEV - totalPV;
                    const costVariance = totalEV - totalAC;
                    const spi = totalPV !== 0 ? (totalEV / totalPV) : 0;
                    const cpi = totalAC !== 0 ? (totalEV / totalAC) : 0;
                    
                    // Add budget summary with EVM metrics
                    worksheetData.push({
                        'Project Name': budget.projectName,
                        'Budget at Completion (BAC)': budget.totalBudget,
                        'Category': 'BUDGET SUMMARY',
                        'Description': 'Total Project Budget',
                        'Planned Value (PV)': totalPV,
                        'Earned Value (EV)': totalEV,
                        'Actual Cost (AC)': totalAC,
                        'Schedule Variance (SV)': scheduleVariance,
                        'Cost Variance (CV)': costVariance,
                        'Schedule Performance Index (SPI)': spi.toFixed(2),
                        'Cost Performance Index (CPI)': cpi.toFixed(2),
                        'Notes': 'EVM Summary'
                    });
                    // Add individual items
                    budget.items.forEach(item => {
                        worksheetData.push({
                            'Project Name': budget.projectName,
                            'Budget at Completion (BAC)': '',
                            'Category': item.category,
                            'Description': item.description,
                            'Planned Value (PV)': item.estimatedCost,
                            'Earned Value (EV)': item.earnedValue,
                            'Actual Cost (AC)': item.actualCost,
                            'Schedule Variance (SV)': item.earnedValue - item.estimatedCost,
                            'Cost Variance (CV)': item.earnedValue - item.actualCost,
                            'Schedule Performance Index (SPI)': item.estimatedCost !== 0 ? (item.earnedValue / item.estimatedCost).toFixed(2) : '0.00',
                            'Cost Performance Index (CPI)': item.actualCost !== 0 ? (item.earnedValue / item.actualCost).toFixed(2) : '0.00',
                            'Notes': item.notes
                        });
                    });
                });
            } else if (filename.includes('RiskRegister')) {
                const riskData = data as RiskRegister[];
                worksheetData = [];
                riskData.forEach(register => {
                    register.risks.forEach(risk => {
                        const levels = { Low: 1, Medium: 2, High: 3 };
                        const score = levels[risk.probability as keyof typeof levels] * levels[risk.impact as keyof typeof levels];
                        const riskLevel = score >= 6 ? 'High' : score >= 4 ? 'Medium' : 'Low';
                        
                        worksheetData.push({
                            'Project Name': register.projectName,
                            'Risk Description': risk.riskDescription,
                            'Category': risk.category,
                            'Probability': risk.probability,
                            'Impact': risk.impact,
                            'Risk Level': riskLevel,
                            'Owner': risk.owner,
                            'Status': risk.status,
                            'Mitigation Strategy': risk.mitigation
                        });
                    });
                });
            }

            // Create workbook and worksheet
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(worksheetData);
            
            // Auto-adjust column widths
            const columnWidths = Object.keys(worksheetData[0] || {}).map(key => ({
                wch: Math.max(
                    key.length,
                    ...worksheetData.map(row => String(row[key] || '').length)
                )
            }));
            worksheet['!cols'] = columnWidths;
            
            // Add worksheet to workbook
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            
            // Save the file
            XLSX.writeFile(workbook, `${filenameWithDate}.xlsx`);
            setMessage(`${filenameWithDate}.xlsx downloaded successfully!`);
            
            // Track successful Excel generation
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'download_complete', {
                    event_category: 'Downloads',
                    event_label: `Excel Success - ${filename}`,
                    custom_parameter_1: 'excel_success'
                });
            }
        } catch (error) {
            console.error('Error generating Excel:', error);
            setMessage(`Failed to generate Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            // Track Excel generation failure
            if (typeof window !== 'undefined' && window.gtag) {
                window.gtag('event', 'download_error', {
                    event_category: 'Errors',
                    event_label: `Excel Error - ${filename}`,
                    custom_parameter_1: 'excel_error'
                });
            }
        }
    };

    // Function to handle email sending (opens mailto link)
    const sendEmail = (content: MeetingMinute[] | ProjectSchedule[] | TaskCard[] | ProjectBudget[] | RiskRegister[] | string, subject: string, filename: string) => {
        // Enhanced plain text representation of the content
        let emailBody = `${subject}\n${'='.repeat(subject.length)}\n\n`;
        
        if (typeof content === 'string') {
            emailBody += content;
        } else if (Array.isArray(content)) {
            // Special handling for Timeline data
            if (filename.includes('Timeline') && content.length > 0) {
                const scheduleData = content as ProjectSchedule[];
                scheduleData.forEach((schedule, scheduleIndex) => {
                    emailBody += `📋 PROJECT: ${schedule.projectName || `Project ${scheduleIndex + 1}`}\n`;
                    emailBody += `📅 Duration: ${schedule.startDate} to ${schedule.endDate}\n`;
                    emailBody += `📊 Total Tasks: ${schedule.tasks.length}\n\n`;
                    
                    if (schedule.tasks.length > 0) {
                        emailBody += `TASKS BREAKDOWN:\n`;
                        emailBody += `${'-'.repeat(50)}\n`;
                        
                        schedule.tasks.forEach((task, taskIndex) => {
                            const statusIcon = task.status === 'Completed' ? '✅' : 
                                             task.status === 'In Progress' ? '🔄' : 
                                             task.status === 'Blocked' ? '🚫' : '⏸️';
                            
                            emailBody += `${taskIndex + 1}. ${statusIcon} ${task.description}\n`;
                            emailBody += `   📆 Start: ${task.taskStartDate || 'Not set'}\n`;
                            emailBody += `   📆 End: ${task.taskEndDate || 'Not set'}\n`;
                            emailBody += `   👤 Assigned: ${task.assignedTo || 'Unassigned'}\n`;
                            emailBody += `   📊 Status: ${task.status}\n\n`;
                        });
                        
                        // Summary statistics
                        const completedTasks = schedule.tasks.filter(t => t.status === 'Completed').length;
                        const inProgressTasks = schedule.tasks.filter(t => t.status === 'In Progress').length;
                        const blockedTasks = schedule.tasks.filter(t => t.status === 'Blocked').length;
                        const notStartedTasks = schedule.tasks.filter(t => t.status === 'Not Started').length;
                        
                        emailBody += `PROGRESS SUMMARY:\n`;
                        emailBody += `${'-'.repeat(30)}\n`;
                        emailBody += `✅ Completed: ${completedTasks}/${schedule.tasks.length} (${Math.round((completedTasks/schedule.tasks.length)*100)}%)\n`;
                        emailBody += `🔄 In Progress: ${inProgressTasks}\n`;
                        emailBody += `🚫 Blocked: ${blockedTasks}\n`;
                        emailBody += `⏸️ Not Started: ${notStartedTasks}\n`;
                    }
                    
                    if (scheduleIndex < scheduleData.length - 1) {
                        emailBody += `\n${'='.repeat(80)}\n\n`;
                    }
                });
            } else {
                // Default handling for other content types
                content.forEach((item, index) => {
                    emailBody += filename.includes('MeetingMinutes') ? `Meeting no. ${index + 1}:\n` : `ENTRY ${index + 1}:\n`;
                    emailBody += `${'-'.repeat(20)}\n`;
                    
                    for (const key in item) {
                        if (key !== 'id' && item[key as keyof typeof item]) {
                            // Format key names for readability in email
                            const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                            
                            // Special handling for action items
                            if (key === 'actionItems' && Array.isArray(item[key as keyof typeof item])) {
                                const actionItems = item[key as keyof typeof item] as unknown as ActionItem[];
                                if (actionItems.length > 0) {
                                    emailBody += `${formattedKey}:\n`;
                                    actionItems.forEach((actionItem, actionIndex) => {
                                        emailBody += `  ${actionIndex + 1}. ${actionItem.task} (Owner: ${actionItem.owner}, Due: ${actionItem.dueDate})\n`;
                                    });
                                }
                            } 
                            // Special handling for tasks array in ProjectSchedule
                            else if (key === 'tasks' && Array.isArray(item[key as keyof typeof item])) {
                                const tasks = item[key as keyof typeof item] as unknown as Task[];
                                if (tasks.length > 0) {
                                    emailBody += `${formattedKey} (${tasks.length} tasks):\n`;
                                    tasks.forEach((task, taskIndex) => {
                                        emailBody += `  ${taskIndex + 1}. ${task.description} [${task.status}] - ${task.assignedTo || 'Unassigned'}\n`;
                                    });
                                }
                            } else {
                                emailBody += `${formattedKey}: ${item[key as keyof typeof item]}\n`;
                            }
                        }
                    }
                    emailBody += '\n---\n\n'; // Separator for multiple entries
                });
            }
        }

        // Add footer with generation info
        emailBody += `\n\n📧 Generated from TaskFlow Canvas (https://silvia-9.github.io/taskflow-canvas/) on ${new Date().toLocaleDateString()}\n`;

        // Encode the subject and body for the mailto link
        const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
        
        // Track email sending attempt
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'email_share', {
                event_category: 'Sharing',
                event_label: `Email - ${filename}`,
                method: 'email',
                custom_parameter_1: 'email_client_opened'
            });
        }
        
        window.open(mailtoLink, '_blank'); // Open in a new tab
        setMessage(`📧 Email client opened with ${subject}. Review and send when ready!`);
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
                <div className="flex items-center justify-center mb-2">
                    <img 
                        src="/taskflow-canvas/TaskFlow Canvas.png" 
                        alt="TaskFlow Canvas Logo" 
                        className="w-16 h-16 mr-4"
                        onError={(e) => {
                            // Hide the image if it fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                    <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-800 drop-shadow-lg">
                        TaskFlow Canvas
                    </h1>
                </div>
                <p className="text-lg text-gray-600">
                    Optimize Your Workflow Visually and Strategically
                </p>
            </header>

            {/* Message Display */}
            {message && (
                <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md mb-6 shadow-md transition-all duration-300 ease-in-out transform scale-100 opacity-100">
                    <p className="font-semibold">{message}</p>
                </div>
            )}

            {/* Tab Navigation */}
            <nav className="mb-8 flex justify-center space-x-2 flex-wrap">
                <button
                    onClick={() => handleTabChange('mom', 'Meeting Notes')}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm md:text-lg transition-all duration-300 ease-in-out shadow-md
                        ${activeTab === 'mom' ? 'bg-blue-600 text-white transform scale-105 shadow-lg' : 'bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800'}`
                    }
                >
                    Meeting Notes
                </button>
                <button
                    onClick={() => handleTabChange('project', 'Gantt Chart')}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm md:text-lg transition-all duration-300 ease-in-out shadow-md
                        ${activeTab === 'project' ? 'bg-blue-600 text-white transform scale-105 shadow-lg' : 'bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800'}`
                    }
                >
                    Gantt Chart
                </button>
                <button
                    onClick={() => handleTabChange('taskboard', 'Kanban Board')}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm md:text-lg transition-all duration-300 ease-in-out shadow-md
                        ${activeTab === 'taskboard' ? 'bg-blue-600 text-white transform scale-105 shadow-lg' : 'bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800'}`
                    }
                >
                    Kanban Board
                </button>
                <button
                    onClick={() => handleTabChange('budget', 'Budget Calculator')}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm md:text-lg transition-all duration-300 ease-in-out shadow-md
                        ${activeTab === 'budget' ? 'bg-blue-600 text-white transform scale-105 shadow-lg' : 'bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800'}`
                    }
                >
                    Budget Calculator
                </button>
                <button
                    onClick={() => handleTabChange('risks', 'Risk Log')}
                    className={`px-4 py-2 rounded-xl font-semibold text-sm md:text-lg transition-all duration-300 ease-in-out shadow-md
                        ${activeTab === 'risks' ? 'bg-blue-600 text-white transform scale-105 shadow-lg' : 'bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800'}`
                    }
                >
                    Risk Log
                </button>
            </nav>

            {/* Conditional Rendering based on active tab */}
            {activeTab === 'mom' && (
                <MinutesOfMeeting
                    onAddMom={handleAddMom}
                    onDeleteMom={handleDeleteMom}
                    momData={momData}
                    momContentRef={momContentRef}
                    downloadPdf={() => {
                        if (momData.length === 0) {
                            setMessage('❌ No meeting notes to export. Please add some meeting notes first.');
                            return;
                        }
                        downloadPdf(momContentRef, 'MeetingMinutes');
                    }}
                    downloadExcel={() => downloadExcel(momData, 'MeetingMinutes', 'Meeting Minutes')}
                    sendEmail={() => sendEmail(momData, 'Meeting Notes', 'MeetingMinutes')}
                />
            )}

            {activeTab === 'project' && (
                <ProjectScheduleComponent
                    onAddProjectSchedule={handleAddProjectSchedule}
                    onDeleteProjectSchedule={handleDeleteProjectSchedule}
                    projectScheduleData={projectScheduleData}
                    projectScheduleContentRef={projectScheduleContentRef}
                    downloadPdf={() => {
                        if (projectScheduleData.length === 0) {
                            setMessage('❌ No schedule data to export. Please add some project schedules first.');
                            return;
                        }
                        downloadPdf(projectScheduleContentRef, 'ProjectTimeline');
                    }}
                    downloadExcel={() => downloadExcel(projectScheduleData, 'ProjectTimeline', 'Timeline')}
                    sendEmail={() => sendEmail(projectScheduleData, 'Timeline', 'ProjectTimeline')}
                />
            )}

            {activeTab === 'taskboard' && (
                <TaskBoardComponent
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                    taskBoardData={taskBoardData}
                    taskBoardContentRef={taskBoardContentRef}
                    downloadPdf={() => {
                        if (taskBoardData.length === 0) {
                            setMessage('❌ No tasks to export. Please add some tasks first.');
                            return;
                        }
                        downloadPdf(taskBoardContentRef, 'TaskBoard');
                    }}
                    downloadExcel={() => downloadExcel(taskBoardData, 'TaskBoard', 'Task Board')}
                    sendEmail={() => sendEmail(taskBoardData, 'Task Board', 'TaskBoard')}
                />
            )}

            {activeTab === 'budget' && (
                <BudgetCalculatorComponent
                    onAddBudget={handleAddBudget}
                    onDeleteBudget={handleDeleteBudget}
                    budgetData={budgetData}
                    budgetContentRef={budgetContentRef}
                    downloadPdf={() => {
                        if (budgetData.length === 0) {
                            setMessage('❌ No budget data to export. Please add some budget information first.');
                            return;
                        }
                        downloadPdf(budgetContentRef, 'ProjectBudget');
                    }}
                    downloadExcel={() => downloadExcel(budgetData, 'ProjectBudget', 'Project Budget')}
                    sendEmail={() => sendEmail(budgetData, 'Project Budget', 'ProjectBudget')}
                />
            )}

            {activeTab === 'risks' && (
                <RiskRegisterComponent
                    onAddRiskRegister={handleAddRiskRegister}
                    onDeleteRiskRegister={handleDeleteRiskRegister}
                    riskRegisterData={riskRegisterData}
                    riskRegisterContentRef={riskRegisterContentRef}
                    downloadPdf={() => {
                        if (riskRegisterData.length === 0) {
                            setMessage('❌ No risk register data to export. Please add some risk information first.');
                            return;
                        }
                        downloadPdf(riskRegisterContentRef, 'RiskRegister');
                    }}
                    downloadExcel={() => downloadExcel(riskRegisterData, 'RiskRegister', 'Risk Register')}
                    sendEmail={() => sendEmail(riskRegisterData, 'Risk Register', 'RiskRegister')}
                />
            )}
        </div>
    );
};

// MinutesOfMeeting Component
interface MinutesOfMeetingProps {
    onAddMom: (newMom: Omit<MeetingMinute, 'id'>) => void;
    onDeleteMom: (id: number) => void;
    momData: MeetingMinute[];
    momContentRef: React.RefObject<HTMLDivElement>;
    downloadPdf: () => void;
    downloadExcel: () => void;
    sendEmail: (content: MeetingMinute[], subject: string, filename: string) => void;
}

const MinutesOfMeeting: React.FC<MinutesOfMeetingProps> = ({ onAddMom, onDeleteMom, momData, momContentRef, downloadPdf, downloadExcel, sendEmail }) => {
    // State for MoM form fields
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [attendees, setAttendees] = useState('');
    const [agenda, setAgenda] = useState('');
    const [discussion, setDiscussion] = useState('');
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    
    // Action item form states
    const [newActionTask, setNewActionTask] = useState('');
    const [newActionOwner, setNewActionOwner] = useState('');
    const [newActionDueDate, setNewActionDueDate] = useState('');
    
    // Add action item
    const addActionItem = () => {
        if (newActionTask.trim() && newActionOwner.trim() && newActionDueDate) {
            const newItem: ActionItem = {
                id: Date.now(),
                task: newActionTask.trim(),
                owner: newActionOwner.trim(),
                dueDate: newActionDueDate
            };
            setActionItems([...actionItems, newItem]);
            setNewActionTask('');
            setNewActionOwner('');
            setNewActionDueDate('');
        }
    };
    
    // Remove action item
    const removeActionItem = (id: number) => {
        setActionItems(actionItems.filter(item => item.id !== id));
    };
    const [nextMeeting, setNextMeeting] = useState('');

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddMom({
            title, date, time, attendees, agenda, discussion, actionItems, nextMeeting
        });
        // Clear form fields after submission
        setTitle(''); setDate(''); setTime(''); setAttendees('');
        setAgenda(''); setDiscussion(''); setActionItems([]); setNextMeeting('');
        setNewActionTask(''); setNewActionOwner(''); setNewActionDueDate('');
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">New Meeting Note</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Input fields for Minutes of Meeting */}
                <InputField label="Date" type="date" value={date} onChange={setDate} required />
                <InputField label="Time" type="time" value={time} onChange={setTime} required />
                <InputField label="Meeting Title" type="text" value={title} onChange={setTitle} required />
                <InputField label="Attendees" type="text" value={attendees} onChange={setAttendees} placeholder="e.g., John Doe " required />
                <TextareaField label="Agenda" value={agenda} onChange={setAgenda} rows={3} placeholder="Key topics to discuss..." required />
                <TextareaField label="Discussion" value={discussion} onChange={setDiscussion} rows={5} placeholder="Summary of discussions and decisions..." required />
                
                {/* Future Actions Management */}
                <div className="md:col-span-2">
                    <label className="block text-gray-700 text-sm font-bold mb-2">Future Actions</label>
                    
                    {/* Add Future Action Form */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Task Description</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Prepare project report"
                                    value={newActionTask}
                                    onChange={(e) => setNewActionTask(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Mary Smith"
                                    value={newActionOwner}
                                    onChange={(e) => setNewActionOwner(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={newActionDueDate}
                                    onChange={(e) => setNewActionDueDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex items-end gap-2">
                                <button
                                    type="button"
                                    onClick={addActionItem}
                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200"
                                >
                                    Add
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setNewActionTask('');
                                        setNewActionOwner('');
                                        setNewActionDueDate('');
                                    }}
                                    className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition duration-200"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Future Actions Table */}
                    {actionItems.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="border border-gray-300 px-4 py-2 text-left">Task</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Owner</th>
                                        <th className="border border-gray-300 px-4 py-2 text-left">Due Date</th>
                                        <th className="border border-gray-300 px-4 py-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {actionItems.map((item) => (
                                        <tr key={item.id}>
                                            <td className="border border-gray-300 px-4 py-2">{item.task}</td>
                                            <td className="border border-gray-300 px-4 py-2">{item.owner}</td>
                                            <td className="border border-gray-300 px-4 py-2">{item.dueDate}</td>
                                            <td className="border border-gray-300 px-4 py-2 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeActionItem(item.id)}
                                                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition duration-200"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <InputField label="Next Meeting Date" type="date" value={nextMeeting} onChange={setNextMeeting} />

                <div className="md:col-span-2 flex justify-center">
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Add New Meeting Note
                    </button>
                </div>
            </form>

            <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">Recorded Meeting Notes</h2>
            {momData.length === 0 ? (
                <p className="text-center text-gray-600 p-4 border rounded-lg bg-gray-50">No meeting notes are recorded yet. Add some above!</p>
            ) : (
                <div ref={momContentRef} data-pdf-content className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200 scrollable-content mb-6">
                    {momData.map((mom, index) => (
                        <div key={mom.id} className="mb-6 pb-6 border-b border-gray-300 last:border-b-0 last:pb-0 relative">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-semibold text-blue-800 mb-2">{mom.title || `Meeting ${index + 1}`}</h3>
                                <button
                                    onClick={() => onDeleteMom(mom.id)}
                                    className="ml-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium transition duration-200 flex items-center"
                                    title="Delete meeting note"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete
                                </button>
                            </div>
                            <p className="text-gray-700 mb-1"><strong>Date:</strong> {mom.date} at {mom.time}</p>
                            {mom.attendees && <p className="text-gray-700 mb-1"><strong>Attendees:</strong> {mom.attendees}</p>}
                            {mom.agenda && <p className="text-gray-700 mb-1"><strong>Agenda:</strong> {mom.agenda}</p>}
                            {mom.actionItems && <p className="text-gray-700 mb-1"><strong>Discussion:</strong> {mom.discussion}</p>}
                            {mom.actionItems && mom.actionItems.length > 0 && (
                                <div className="mb-1">
                                    <p className="text-gray-700 font-bold mb-2">Future Actions:</p>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse border border-gray-300 text-sm">
                                            <thead>
                                                <tr className="bg-gray-100">
                                                    <th className="border border-gray-300 px-3 py-1 text-left">Task</th>
                                                    <th className="border border-gray-300 px-3 py-1 text-left">Owner</th>
                                                    <th className="border border-gray-300 px-3 py-1 text-left">Due Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {mom.actionItems.map((item) => (
                                                    <tr key={item.id}>
                                                        <td className="border border-gray-300 px-3 py-1">{item.task}</td>
                                                        <td className="border border-gray-300 px-3 py-1">{item.owner}</td>
                                                        <td className="border border-gray-300 px-3 py-1">{item.dueDate}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {mom.nextMeeting && <p className="text-gray-700"><strong>Next Meeting:</strong> {mom.nextMeeting}</p>}
                        </div>
                    ))}
                </div>
            )}
            
            {/* Always show buttons, but disable when no data */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                <ActionButton
                    onClick={momData.length > 0 ? downloadPdf : () => alert('Please add meeting notes first')}
                    label="Download PDF"
                    icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    color="green"
                />
                <ActionButton
                    onClick={momData.length > 0 ? downloadExcel : () => alert('Please add meeting notes first')}
                    label="Download Excel"
                    icon="M13 14l-4-4m0 0l-4 4m4-4v12"
                    color="blue"
                />
                <ActionButton
                    onClick={momData.length > 0 ? () => sendEmail(momData, 'Meeting Notes', 'MeetingMinutes') : () => alert('Please add meeting notes first')}
                    label="Send Email"
                    icon="M3 8l4 4 4-4m0 6l-4 4-4-4"
                    color="orange"
                />
            </div>
        </div>
    );
};

// GanttChart Component
interface GanttChartProps {
    projectSchedule: ProjectSchedule;
}

const GanttChart: React.FC<GanttChartProps> = ({ projectSchedule }) => {
    // Helper function to calculate position and width of task bars
    const getTaskBarStyle = (task: Task) => {
        if (!task.taskStartDate || !task.taskEndDate || !projectSchedule.startDate || !projectSchedule.endDate) {
            return { left: '0%', width: '0%' };
        }

        const projectStart = new Date(projectSchedule.startDate);
        const projectEnd = new Date(projectSchedule.endDate);
        const taskStart = new Date(task.taskStartDate);
        const taskEnd = new Date(task.taskEndDate);
        
        const projectDuration = projectEnd.getTime() - projectStart.getTime();
        const taskStartOffset = taskStart.getTime() - projectStart.getTime();
        const taskDuration = taskEnd.getTime() - taskStart.getTime();
        
        const leftPercent = Math.max(0, (taskStartOffset / projectDuration) * 100);
        const widthPercent = Math.min(100 - leftPercent, (taskDuration / projectDuration) * 100);
        
        return {
            left: `${leftPercent}%`,
            width: `${widthPercent}%`
        };
    };

    // Helper function to get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-green-500';
            case 'In Progress': return 'bg-yellow-500';
            case 'Blocked': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    // Helper function to format date for display
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
    };

    // Generate time scale markers
    const generateTimeScale = () => {
        if (!projectSchedule.startDate || !projectSchedule.endDate) return [];
        
        const start = new Date(projectSchedule.startDate);
        const end = new Date(projectSchedule.endDate);
        const markers = [];
        
        // Create weekly markers for better readability
        const current = new Date(start);
        current.setDate(current.getDate() - current.getDay()); // Start from beginning of week
        
        while (current <= end) {
            const position = ((current.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;
            if (position >= 0 && position <= 100) {
                markers.push({
                    position: `${position}%`,
                    date: formatDate(current.toISOString().split('T')[0])
                });
            }
            current.setDate(current.getDate() + 7); // Next week
        }
        
        return markers;
    };

    const timeMarkers = generateTimeScale();

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mt-4">
            <h4 className="text-lg font-medium text-gray-700 mb-4">Timeline Gantt Chart</h4>
            
            {/* Time scale header */}
            <div className="relative mb-2 h-8 bg-gray-50 rounded border">
                {timeMarkers.map((marker, index) => (
                    <div
                        key={index}
                        className="absolute top-0 h-full"
                        style={{ left: marker.position }}
                    >
                        <div className="w-px h-full bg-gray-300"></div>
                        <div className="absolute top-1 left-1 text-xs text-gray-600 whitespace-nowrap">
                            {marker.date}
                        </div>
                    </div>
                ))}
            </div>

            {/* Tasks */}
            <div className="space-y-2">
                {projectSchedule.tasks.map((task, index) => (
                    <div key={task.id} className="relative">
                        {/* Task info */}
                        <div className="flex items-center mb-1">
                            <div className="w-48 text-sm font-medium text-gray-700 truncate mr-4">
                                {task.description}
                            </div>
                            <div className="text-xs text-gray-500">
                                {task.assignedTo && `(${task.assignedTo})`}
                            </div>
                        </div>
                        
                        {/* Gantt bar container */}
                        <div className="relative h-6 bg-gray-100 rounded border">
                            {/* Task bar */}
                            <div
                                className={`absolute top-0 h-full rounded ${getStatusColor(task.status)} opacity-80 flex items-center justify-center`}
                                style={getTaskBarStyle(task)}
                                title={`${task.description}: ${formatDate(task.taskStartDate)} - ${formatDate(task.taskEndDate)} (${task.status})`}
                            >
                                <span className="text-xs text-white font-medium px-1 truncate">
                                    {task.status === 'Completed' ? '✓' : 
                                     task.status === 'In Progress' ? '⏳' : 
                                     task.status === 'Blocked' ? '⚠️' : '○'}
                                </span>
                            </div>
                        </div>
                        
                        {/* Date labels */}
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>{formatDate(task.taskStartDate)}</span>
                            <span>{formatDate(task.taskEndDate)}</span>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded mr-1"></div>
                    <span>Not Started</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded mr-1"></div>
                    <span>In Progress</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
                    <span>Completed</span>
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded mr-1"></div>
                    <span>Blocked</span>
                </div>
            </div>
        </div>
    );
};

// ProjectSchedule Component
interface ProjectScheduleProps {
    onAddProjectSchedule: (newSchedule: Omit<ProjectSchedule, 'id'>) => void;
    onDeleteProjectSchedule: (id: number) => void;
    projectScheduleData: ProjectSchedule[];
    projectScheduleContentRef: React.RefObject<HTMLDivElement>;
    downloadPdf: () => void;
    downloadExcel: () => void;
    sendEmail: (content: ProjectSchedule[], subject: string, filename: string) => void;
}

const ProjectScheduleComponent: React.FC<ProjectScheduleProps> = ({ onAddProjectSchedule, onDeleteProjectSchedule, projectScheduleData, projectScheduleContentRef, downloadPdf, downloadExcel, sendEmail }) => {
    // State for Timeline form fields
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
        
        // Validate required task fields
        const invalidTasks = tasks.filter(task => 
            !task.description.trim() || 
            !task.assignedTo.trim() || 
            !task.taskStartDate || 
            !task.taskEndDate || 
            !task.status
        );
        
        if (invalidTasks.length > 0) {
            alert('Please fill in all required fields (Task Description, Assigned To, Start Date, End Date, and Status) for all tasks.');
            return;
        }
        
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
            <p className="text-center text-gray-600 mb-6 text-sm">Create project schedules with Gantt chart visualization to track task timelines and dependencies</p>
            <form onSubmit={handleSubmit} className="mb-8">
                {/* Project details in one row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <InputField label="Project Name" type="text" value={projectName} onChange={setProjectName} required />
                    <InputField label="Start Date" type="date" value={startDate} onChange={setStartDate} required />
                    <InputField label="End Date" type="date" value={endDate} onChange={setEndDate} required />
                </div>

                <div className="mt-4">
                    <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Project Tasks & Timeline</h3>
                    {tasks.map((task, index) => (
                        <div key={task.id} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                            {/* First row: Description and Assigned To */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <InputField
                                    label="Task Description"
                                    type="text"
                                    value={task.description}
                                    onChange={(val: string) => handleTaskChange(task.id, 'description', val)}
                                    placeholder="e.g., Design UI"
                                    required
                                />
                                <InputField
                                    label="Assigned To"
                                    type="text"
                                    value={task.assignedTo}
                                    onChange={(val: string) => handleTaskChange(task.id, 'assignedTo', val)}
                                    placeholder="e.g., Alice"
                                    required
                                />
                            </div>
                            {/* Second row: Start Date, End Date, and Status */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <InputField
                                    label="Start Date"
                                    type="date"
                                    value={task.taskStartDate}
                                    onChange={(val: string) => handleTaskChange(task.id, 'taskStartDate', val)}
                                    required
                                />
                                <InputField
                                    label="End Date"
                                    type="date"
                                    value={task.taskEndDate}
                                    onChange={(val: string) => handleTaskChange(task.id, 'taskEndDate', val)}
                                    required
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status <span className="text-red-500">*</span></label>
                                    <select
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                        value={task.status}
                                        onChange={(e) => handleTaskChange(task.id, 'status', e.target.value)}
                                        required
                                    >
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Blocked">Blocked</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-center gap-4 mt-6">
                    <button
                        type="button"
                        onClick={addTask}
                        className="bg-green-500 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:bg-green-600 transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Add
                    </button>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
                    >
                        Save
                    </button>
                </div>
            </form>

            <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">Project Schedules</h2>
            {projectScheduleData.length === 0 ? (
                <p className="text-center text-gray-600 p-4 border rounded-lg bg-gray-50">No project schedules created yet. Add some above!</p>
            ) : (
                <>
                    <div ref={projectScheduleContentRef} data-pdf-content className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200 scrollable-content mb-6">
                        {projectScheduleData.map((schedule, index) => (
                            <div key={schedule.id} className="mb-6 pb-6 border-b border-gray-300 last:border-b-0 last:pb-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-xl font-semibold text-blue-800 mb-2">{schedule.projectName || `Project ${index + 1}`}</h3>
                                    <button
                                        onClick={() => onDeleteProjectSchedule(schedule.id)}
                                        className="ml-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm font-medium transition duration-200 flex items-center"
                                        title="Delete timeline"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                    </button>
                                </div>
                                <p className="text-gray-700 mb-1"><strong>Duration:</strong> {schedule.startDate} to {schedule.endDate}</p>
                                <h4 className="text-lg font-medium text-gray-700 mt-4 mb-2">Tasks:</h4>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
                                        <thead className="bg-blue-100">
                                            <tr>
                                                <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800 uppercase tracking-wider rounded-tl-lg">Task Description</th>
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
                                
                                {/* Gantt Chart */}
                                <GanttChart projectSchedule={schedule} />
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                        <ActionButton
                            onClick={downloadPdf}
                            label="Download PDF"
                            icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            color="teal"
                        />
                        <ActionButton
                            onClick={downloadExcel}
                            label="Download Excel"
                            icon="M13 14l-4-4m0 0l-4 4m4-4v12"
                            color="blue"
                        />
                        <ActionButton
                            onClick={() => sendEmail(projectScheduleData, 'Timeline', 'ProjectTimeline')}
                            label="Send Email"
                            icon="M3 8l4 4 4-4m0 6l-4 4-4-4"
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
                        label="Download Excel"
                        icon="M13 14l-4-4m0 0l-4 4m4-4v12"
                        color="blue"
                    />
                    <ActionButton
                        onClick={() => alert('Please add project schedules first')}
                        label="Send Email"
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
    required?: boolean;
}

const TextareaField: React.FC<TextareaFieldProps> = ({ label, value, onChange, rows, placeholder = '', required = false }) => (
    <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            required={required}
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

// Kanban Board Component
interface TaskBoardProps {
    onAddTask: (newTask: Omit<TaskCard, 'id'>) => void;
    onDeleteTask: (id: number) => void;
    onUpdateTaskStatus: (taskId: number, newStatus: TaskCard['status']) => void;
    taskBoardData: TaskCard[];
    taskBoardContentRef: React.RefObject<HTMLDivElement>;
    downloadPdf: () => void;
    downloadExcel: () => void;
    sendEmail: (content: TaskCard[], subject: string, filename: string) => void;
}

const TaskBoardComponent: React.FC<TaskBoardProps> = ({ onAddTask, onDeleteTask, onUpdateTaskStatus, taskBoardData, taskBoardContentRef, downloadPdf, downloadExcel, sendEmail }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [priority, setPriority] = useState<TaskCard['priority']>('Low');
    const [dueDate, setDueDate] = useState('');
    const [tags, setTags] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate required fields
        if (!title.trim()) {
            alert('Please enter a task title.');
            return;
        }
        if (!assignedTo.trim()) {
            alert('Please assign the task to someone.');
            return;
        }
        if (!description.trim()) {
            alert('Please provide a task description.');
            return;
        }
        if (!priority) {
            alert('Please select a priority level.');
            return;
        }
        if (!dueDate) {
            alert('Please select a due date.');
            return;
        }
        
        onAddTask({
            title, description, assignedTo, priority, status: 'Not Started', dueDate,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        });
        setTitle(''); setDescription(''); setAssignedTo(''); setPriority('Low'); setDueDate(''); setTags('');
    };

    const getStatusTasks = (status: TaskCard['status']) => taskBoardData.filter(task => task.status === status);
    const statusColumns: TaskCard['status'][] = ['Not Started', 'In Progress', 'Review', 'Done'];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">Kanban Board</h2>
            <p className="text-center text-gray-600 mb-6 text-sm">Manage individual tasks with priority levels and workflow status tracking through Kanban columns</p>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
                <InputField label="Task" type="text" value={title} onChange={setTitle} required />
                <InputField label="Assigned To" type="text" value={assignedTo} onChange={setAssignedTo} placeholder="e.g., John Doe" required />
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority <span className="text-red-500">*</span></label>
                    <select 
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        value={priority} 
                        onChange={(e) => setPriority(e.target.value as TaskCard['priority'])}
                        required
                    >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>
                <InputField label="Due Date" type="date" value={dueDate} onChange={setDueDate} required />
                <TextareaField label="Description" value={description} onChange={setDescription} rows={3} placeholder="Task details..." required />
                <InputField label="Category" type="text" value={tags} onChange={setTags} placeholder="e.g., sales, urgent" />
                
                <div className="md:col-span-2 flex justify-center">
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:bg-blue-700 transition duration-300">
                        Add Task
                    </button>
                </div>
            </form>

            <div ref={taskBoardContentRef} data-pdf-content>
                <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-700">Task Status</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {statusColumns.map(status => (
                        <div key={status} className="bg-gray-50 p-4 rounded-lg shadow-inner">
                            <h4 className={`text-lg font-semibold mb-4 text-center py-2 rounded ${
                                status === 'Not Started' ? 'bg-gray-200 text-gray-800' :
                                status === 'In Progress' ? 'bg-yellow-200 text-yellow-800' :
                                status === 'Review' ? 'bg-blue-200 text-blue-800' :
                                'bg-green-200 text-green-800'
                            }`}>
                                {status} ({getStatusTasks(status).length})
                            </h4>
                        <div className="space-y-3 min-h-[200px]">
                            {getStatusTasks(status).map(task => (
                                <div key={task.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                    <h4 className="font-semibold text-gray-800 mb-1">{task.title}</h4>
                                    <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                            task.priority === 'High' ? 'bg-red-200 text-red-800' :
                                            task.priority === 'Medium' ? 'bg-yellow-200 text-yellow-800' :
                                            'bg-green-200 text-green-800'
                                        }`}>
                                            {task.priority}
                                        </span>
                                        <span className="text-xs text-gray-500">{task.dueDate}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-2">👤 {task.assignedTo}</p>
                                    {task.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-2">
                                            {task.tags.map((tag, idx) => (
                                                <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <select 
                                            className="flex-1 text-xs p-1 border border-gray-300 rounded"
                                            value={task.status}
                                            onChange={(e) => onUpdateTaskStatus(task.id, e.target.value as TaskCard['status'])}
                                        >
                                            <option value="Not Started">Not Started</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Review">Review</option>
                                            <option value="Done">Done</option>
                                        </select>
                                        <button
                                            onClick={() => onDeleteTask(task.id)}
                                            className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition duration-200"
                                            title="Delete task"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                <ActionButton
                    onClick={taskBoardData.length > 0 ? downloadPdf : () => alert('Please add tasks first')}
                    label="Download PDF"
                    icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    color="purple"
                />
                <ActionButton
                    onClick={taskBoardData.length > 0 ? downloadExcel : () => alert('Please add tasks first')}
                    label="Download Excel"
                    icon="M13 14l-4-4m0 0l-4 4m4-4v12"
                    color="blue"
                />
                <ActionButton
                    onClick={taskBoardData.length > 0 ? () => sendEmail(taskBoardData, 'Task Board', 'TaskBoard') : () => alert('Please add tasks first')}
                    label="Send Email"
                    icon="M3 8l4 4 4-4m0 6l-4 4-4-4"
                    color="indigo"
                />
            </div>
        </div>
    );
};

// Budget Calculator Component
interface BudgetCalculatorProps {
    onAddBudget: (newBudget: Omit<ProjectBudget, 'id'>) => void;
    onDeleteBudget: (id: number) => void;
    budgetData: ProjectBudget[];
    budgetContentRef: React.RefObject<HTMLDivElement>;
    downloadPdf: () => void;
    downloadExcel: () => void;
    sendEmail: (content: ProjectBudget[], subject: string, filename: string) => void;
}

const BudgetCalculatorComponent: React.FC<BudgetCalculatorProps> = ({ onAddBudget, onDeleteBudget, budgetData, budgetContentRef, downloadPdf, downloadExcel, sendEmail }) => {
    const [projectName, setProjectName] = useState('');
    const [totalBudget, setTotalBudget] = useState('');
    const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([
        { id: 1, category: '', description: '', estimatedCost: 0, actualCost: 0, earnedValue: 0, notes: '' }
    ]);

    const addBudgetItem = () => {
        setBudgetItems(prev => [...prev, { 
            id: Date.now(), category: '', description: '', estimatedCost: 0, actualCost: 0, earnedValue: 0, notes: '' 
        }]);
    };

    const handleBudgetItemChange = (id: number, field: keyof BudgetItem, value: string | number) => {
        setBudgetItems(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const removeBudgetItem = (id: number) => {
        if (budgetItems.length > 1) {
            setBudgetItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate required cost category fields
        const invalidItems = budgetItems.filter(item => 
            !item.category.trim() || 
            !item.description.trim() ||
            item.estimatedCost < 0 ||
            item.actualCost < 0 ||
            item.earnedValue < 0
        );
        
        if (invalidItems.length > 0) {
            alert('Please fill in all required fields (Category, Description, Planned Value, and Actual Cost) for all cost categories. Values cannot be negative.');
            return;
        }
        
        onAddBudget({
            projectName, totalBudget: parseFloat(totalBudget), items: budgetItems
        });
        setProjectName(''); setTotalBudget('');
        setBudgetItems([{ id: 1, category: '', description: '', estimatedCost: 0, actualCost: 0, earnedValue: 0, notes: '' }]);
    };

    const getTotalEstimated = (budget: ProjectBudget) => budget.items.reduce((sum, item) => sum + item.estimatedCost, 0);
    const getTotalActual = (budget: ProjectBudget) => budget.items.reduce((sum, item) => sum + item.actualCost, 0);
    const getTotalEarnedValue = (budget: ProjectBudget) => budget.items.reduce((sum, item) => sum + item.earnedValue, 0);
    
    // EVM Calculations
    const getScheduleVariance = (budget: ProjectBudget) => {
        const ev = getTotalEarnedValue(budget);
        const pv = getTotalEstimated(budget);
        return ev - pv; // SV = EV - PV
    };
    
    const getCostVariance = (budget: ProjectBudget) => {
        const ev = getTotalEarnedValue(budget);
        const ac = getTotalActual(budget);
        return ev - ac; // CV = EV - AC
    };
    
    const getSchedulePerformanceIndex = (budget: ProjectBudget) => {
        const ev = getTotalEarnedValue(budget);
        const pv = getTotalEstimated(budget);
        return pv > 0 ? ev / pv : 0; // SPI = EV / PV
    };
    
    const getCostPerformanceIndex = (budget: ProjectBudget) => {
        const ev = getTotalEarnedValue(budget);
        const ac = getTotalActual(budget);
        return ac > 0 ? ev / ac : 0; // CPI = EV / AC
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">Project Budget Calculator</h2>
            
            <form onSubmit={handleSubmit} className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <InputField label="Project Name" type="text" value={projectName} onChange={setProjectName} required />
                    <InputField label="Budget at Completion (BAC)" type="number" value={totalBudget} onChange={setTotalBudget} placeholder="$0.00" required />
                </div>

                <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Cost Categories</h3>
                {budgetItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                        {budgetItems.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeBudgetItem(item.id)}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full text-sm hover:bg-red-600 transition duration-200 flex items-center justify-center"
                                title="Delete this cost category"
                            >
                                ✕
                            </button>
                        )}
                        <InputField 
                            label="Category"
                            type="text" 
                            value={item.category} 
                            onChange={(val) => handleBudgetItemChange(item.id, 'category', val)}
                            placeholder="e.g., Development"
                            required
                        />
                        <InputField 
                            label="Description"
                            type="text" 
                            value={item.description} 
                            onChange={(val) => handleBudgetItemChange(item.id, 'description', val)}
                            placeholder="e.g.,Frontend development tasks"
                            required
                        />
                        <InputField 
                            label="Planned Value"
                            type="number" 
                            value={item.estimatedCost === 0 ? '' : item.estimatedCost.toString()} 
                            onChange={(val) => handleBudgetItemChange(item.id, 'estimatedCost', parseFloat(val) || 0)}
                            placeholder="$0.00"
                            required
                        />
                        <InputField 
                            label="Actual Cost"
                            type="number" 
                            value={item.actualCost === 0 ? '' : item.actualCost.toString()} 
                            onChange={(val) => handleBudgetItemChange(item.id, 'actualCost', parseFloat(val) || 0)}
                            placeholder="$0.00"
                            required
                        />
                        <InputField 
                            label="Earned Value"
                            type="number" 
                            value={item.earnedValue === 0 ? '' : item.earnedValue.toString()} 
                            onChange={(val) => handleBudgetItemChange(item.id, 'earnedValue', parseFloat(val) || 0)}
                            placeholder="$0.00"
                        />
                        <div className="md:col-span-2">
                            <InputField 
                                label="Notes"
                                type="text" 
                                value={item.notes} 
                                onChange={(val) => handleBudgetItemChange(item.id, 'notes', val)}
                                placeholder="Additional notes"
                            />
                        </div>
                    </div>
                ))}
                
                <div className="flex justify-center gap-4 mb-6">
                    <button type="button" onClick={addBudgetItem} className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold shadow-md hover:bg-green-600 transition duration-300">
                        Add
                    </button>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:bg-blue-700 transition duration-300">
                        Save
                    </button>
                </div>
            </form>

            <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">Budget Overview</h2>
            {budgetData.length === 0 ? (
                <p className="text-center text-gray-600 p-4 border rounded-lg bg-gray-50">No budgets recorded yet. Add some above!</p>
            ) : (
                <div ref={budgetContentRef} data-pdf-content className="space-y-6 scrollable-content">
                    {budgetData.map((budget, index) => (
                        <div key={budget.id} className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-blue-800">{budget.projectName}</h3>
                                <button
                                    onClick={() => onDeleteBudget(budget.id)}
                                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition duration-200"
                                    title="Delete budget"
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                                {/* Primary EVM Values */}
                                <div className="bg-blue-100 p-4 rounded-lg text-center">
                                    <p className="text-sm text-blue-600 font-medium">Budget at Completion (BAC)</p>
                                    <p className="text-2xl font-bold text-blue-800">${budget.totalBudget.toFixed(2)}</p>
                                </div>
                                <div className="bg-yellow-100 p-4 rounded-lg text-center">
                                    <p className="text-sm text-yellow-600 font-medium">Planned Value (PV)</p>
                                    <p className="text-2xl font-bold text-yellow-800">${getTotalEstimated(budget).toFixed(2)}</p>
                                </div>
                                <div className="bg-purple-100 p-4 rounded-lg text-center">
                                    <p className="text-sm text-purple-600 font-medium">Earned Value (EV)</p>
                                    <p className="text-2xl font-bold text-purple-800">${getTotalEarnedValue(budget).toFixed(2)}</p>
                                </div>
                                <div className="bg-green-100 p-4 rounded-lg text-center">
                                    <p className="text-sm text-green-600 font-medium">Actual Cost (AC)</p>
                                    <p className="text-2xl font-bold text-green-800">${getTotalActual(budget).toFixed(2)}</p>
                                </div>
                                
                                {/* EVM Variances */}
                                <div className="bg-gray-100 p-4 rounded-lg text-center">
                                    <p className="text-sm text-gray-600 font-medium">
                                        Schedule Variance (SV)
                                    </p>
                                    <p className={`text-xl font-bold ${getScheduleVariance(budget) < 0 ? 'text-red-600' : 'text-black'}`}>
                                        ${getScheduleVariance(budget).toFixed(2)}
                                    </p>
                                </div>
                                <div className="bg-gray-100 p-4 rounded-lg text-center">
                                    <p className="text-sm text-gray-600 font-medium">
                                        Cost Variance (CV)
                                    </p>
                                    <p className={`text-xl font-bold ${getCostVariance(budget) < 0 ? 'text-red-600' : 'text-black'}`}>
                                        ${getCostVariance(budget).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                            
                            {/* EVM Performance Indices */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className={`p-4 rounded-lg text-center ${getSchedulePerformanceIndex(budget) >= 1 ? 'bg-blue-100' : 'bg-red-100'}`}>
                                    <p className={`text-sm font-medium ${getSchedulePerformanceIndex(budget) >= 1 ? 'text-blue-600' : 'text-red-600'}`}>
                                        Schedule Performance Index (SPI)
                                    </p>
                                    <p className={`text-2xl font-bold ${getSchedulePerformanceIndex(budget) >= 1 ? 'text-blue-800' : 'text-red-800'}`}>
                                        {getSchedulePerformanceIndex(budget).toFixed(3)}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {getSchedulePerformanceIndex(budget) >= 1 ? 'Ahead/On Schedule' : 'Behind Schedule'}
                                    </p>
                                </div>
                                <div className={`p-4 rounded-lg text-center ${getCostPerformanceIndex(budget) >= 1 ? 'bg-purple-100' : 'bg-red-100'}`}>
                                    <p className={`text-sm font-medium ${getCostPerformanceIndex(budget) >= 1 ? 'text-purple-600' : 'text-red-600'}`}>
                                        Cost Performance Index (CPI)
                                    </p>
                                    <p className={`text-2xl font-bold ${getCostPerformanceIndex(budget) >= 1 ? 'text-purple-800' : 'text-red-800'}`}>
                                        {getCostPerformanceIndex(budget).toFixed(3)}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-1">
                                        {getCostPerformanceIndex(budget) >= 1 ? 'Under/On Budget' : 'Over Budget'}
                                    </p>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white rounded-lg shadow-md">
                                    <thead className="bg-blue-100">
                                        <tr>
                                            <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800">Category</th>
                                            <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800">Description</th>
                                            <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800">Planned Value (PV)</th>
                                            <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800">Earned Value (EV)</th>
                                            <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800">Actual Cost (AC)</th>
                                            <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {budget.items.map(item => (
                                            <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                <td className="py-2 px-4 text-sm text-gray-800">{item.category}</td>
                                                <td className="py-2 px-4 text-sm text-gray-800">{item.description}</td>
                                                <td className="py-2 px-4 text-sm text-gray-800">${item.estimatedCost.toFixed(2)}</td>
                                                <td className="py-2 px-4 text-sm text-gray-800">${item.earnedValue.toFixed(2)}</td>
                                                <td className="py-2 px-4 text-sm text-gray-800">${item.actualCost.toFixed(2)}</td>
                                                <td className="py-2 px-4 text-sm text-gray-800">{item.notes}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                <ActionButton
                    onClick={budgetData.length > 0 ? downloadPdf : () => alert('Please add budgets first')}
                    label="Download PDF"
                    icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    color="green"
                />
                <ActionButton
                    onClick={budgetData.length > 0 ? downloadExcel : () => alert('Please add budgets first')}
                    label="Download Excel"
                    icon="M13 14l-4-4m0 0l-4 4m4-4v12"
                    color="blue"
                />
                <ActionButton
                    onClick={budgetData.length > 0 ? () => sendEmail(budgetData, 'Project Budget', 'ProjectBudget') : () => alert('Please add budgets first')}
                    label="Send Email"
                    icon="M3 8l4 4 4-4m0 6l-4 4-4-4"
                    color="orange"
                />
            </div>
        </div>
    );
};

// Risk Register Component
interface RiskRegisterProps {
    onAddRiskRegister: (newRiskRegister: Omit<RiskRegister, 'id'>) => void;
    onDeleteRiskRegister: (id: number) => void;
    riskRegisterData: RiskRegister[];
    riskRegisterContentRef: React.RefObject<HTMLDivElement>;
    downloadPdf: () => void;
    downloadExcel: () => void;
    sendEmail: (content: RiskRegister[], subject: string, filename: string) => void;
}

const RiskRegisterComponent: React.FC<RiskRegisterProps> = ({ onAddRiskRegister, onDeleteRiskRegister, riskRegisterData, riskRegisterContentRef, downloadPdf, downloadExcel, sendEmail }) => {
    const [projectName, setProjectName] = useState('');
    const [risks, setRisks] = useState<Risk[]>([
        { id: 1, riskDescription: '', probability: 'Medium', impact: 'Medium', category: '', mitigation: '', owner: '', status: 'Open' }
    ]);

    const addRisk = () => {
        setRisks(prev => [...prev, { 
            id: Date.now(), riskDescription: '', probability: 'Medium', impact: 'Medium', 
            category: '', mitigation: '', owner: '', status: 'Open' 
        }]);
    };

    const handleRiskChange = (id: number, field: keyof Risk, value: string) => {
        setRisks(prev => prev.map(risk =>
            risk.id === id ? { ...risk, [field]: value } : risk
        ));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddRiskRegister({ projectName, risks });
        setProjectName('');
        setRisks([{ id: 1, riskDescription: '', probability: 'Medium', impact: 'Medium', category: '', mitigation: '', owner: '', status: 'Open' }]);
    };

    const getRiskLevel = (probability: string, impact: string) => {
        const levels = { Low: 1, Medium: 2, High: 3 };
        const score = levels[probability as keyof typeof levels] * levels[impact as keyof typeof levels];
        if (score >= 6) return { level: 'High', color: 'bg-red-200 text-red-800' };
        if (score >= 4) return { level: 'Medium', color: 'bg-yellow-200 text-yellow-800' };
        return { level: 'Low', color: 'bg-green-200 text-green-800' };
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">Risk Register</h2>
            
            <form onSubmit={handleSubmit} className="mb-8">
                <div className="mb-6">
                    <InputField label="Project Name" type="text" value={projectName} onChange={setProjectName} required />
                </div>

                <h3 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Project Risks</h3>
                {risks.map((risk, index) => (
                    <div key={risk.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="md:col-span-2">
                            <TextareaField
                                label="Description"
                                value={risk.riskDescription}
                                onChange={(val) => handleRiskChange(risk.id, 'riskDescription', val)}
                                rows={2}
                                placeholder="Describe the risk..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Probability</label>
                            <select 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                value={risk.probability}
                                onChange={(e) => handleRiskChange(risk.id, 'probability', e.target.value)}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
                            <select 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                value={risk.impact}
                                onChange={(e) => handleRiskChange(risk.id, 'impact', e.target.value)}
                            >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <InputField 
                            label="Category"
                            type="text" 
                            value={risk.category} 
                            onChange={(val) => handleRiskChange(risk.id, 'category', val)}
                            placeholder="e.g., Technical, Financial"
                        />
                        <InputField 
                            label="Risk Owner"
                            type="text" 
                            value={risk.owner} 
                            onChange={(val) => handleRiskChange(risk.id, 'owner', val)}
                            placeholder="e.g., John Doe"
                        />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select 
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                value={risk.status}
                                onChange={(e) => handleRiskChange(risk.id, 'status', e.target.value)}
                            >
                                <option value="Open">Open</option>
                                <option value="Mitigated">Mitigated</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <TextareaField
                                label="Mitigation Strategy"
                                value={risk.mitigation}
                                onChange={(val) => handleRiskChange(risk.id, 'mitigation', val)}
                                rows={2}
                                placeholder="How to mitigate..."
                            />
                        </div>
                    </div>
                ))}
                
                <div className="flex justify-center gap-4 mb-6">
                    <button type="button" onClick={addRisk} className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold shadow-md hover:bg-green-600 transition duration-300">
                        Add New Risk
                    </button>
                    <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:bg-blue-700 transition duration-300">
                        Save
                    </button>
                </div>
            </form>

            <h2 className="text-2xl font-bold text-blue-700 mb-4 text-center">Risk Register</h2>
            {riskRegisterData.length === 0 ? (
                <p className="text-center text-gray-600 p-4 border rounded-lg bg-gray-50">No risk register recorded yet. Add some above!</p>
            ) : (
                <div ref={riskRegisterContentRef} data-pdf-content className="space-y-6 scrollable-content">
                    {riskRegisterData.map((register, index) => (
                        <div key={register.id} className="bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-semibold text-blue-800">{register.projectName} Risk Register</h3>
                                <button
                                    onClick={() => onDeleteRiskRegister(register.id)}
                                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition duration-200"
                                    title="Delete risk register"
                                >
                                    🗑️ Delete
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white rounded-lg shadow-md">
                                    <thead className="bg-blue-100">
                                        <tr>
                                            <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800">Risk Description</th>
                                            <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800">Category</th>
                                            <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800">Probability</th>
                                            <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800">Impact</th>
                                            <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800">Risk Level</th>
                                            <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800">Owner</th>
                                            <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800">Status</th>
                                            <th className="py-2 px-4 text-left text-sm font-semibold text-blue-800">Mitigation</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {register.risks.map(risk => {
                                            const riskLevel = getRiskLevel(risk.probability, risk.impact);
                                            return (
                                                <tr key={risk.id} className="border-b border-gray-200 hover:bg-gray-50">
                                                    <td className="py-2 px-4 text-sm text-gray-800">{risk.riskDescription}</td>
                                                    <td className="py-2 px-4 text-sm text-gray-800">{risk.category}</td>
                                                    <td className="py-2 px-4 text-sm text-gray-800">{risk.probability}</td>
                                                    <td className="py-2 px-4 text-sm text-gray-800">{risk.impact}</td>
                                                    <td className="py-2 px-4 text-sm text-gray-800">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${riskLevel.color}`}>
                                                            {riskLevel.level}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-4 text-sm text-gray-800">{risk.owner}</td>
                                                    <td className="py-2 px-4 text-sm text-gray-800">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                            risk.status === 'Open' ? 'bg-red-200 text-red-800' :
                                                            risk.status === 'Mitigated' ? 'bg-yellow-200 text-yellow-800' :
                                                            'bg-green-200 text-green-800'
                                                        }`}>
                                                            {risk.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-2 px-4 text-sm text-gray-800">{risk.mitigation}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                <ActionButton
                    onClick={riskRegisterData.length > 0 ? downloadPdf : () => alert('Please add risk register first')}
                    label="Download PDF"
                    icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    color="red"
                />
                <ActionButton
                    onClick={riskRegisterData.length > 0 ? downloadExcel : () => alert('Please add risk register first')}
                    label="Download Excel"
                    icon="M13 14l-4-4m0 0l-4 4m4-4v12"
                    color="blue"
                />
                <ActionButton
                    onClick={riskRegisterData.length > 0 ? () => sendEmail(riskRegisterData, 'Risk Register', 'RiskRegister') : () => alert('Please add risk register first')}
                    label="Send Email"
                    icon="M3 8l4 4 4-4m0 6l-4 4-4-4"
                    color="pink"
                />
            </div>
        </div>
    );
};

export default App;