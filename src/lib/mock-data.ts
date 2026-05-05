
export type ServiceStatus = 'Pending' | 'In Progress' | 'Completed' | 'Urgent';

export interface ServiceRequest {
  id: string;
  title: string;
  customer: string;
  description: string;
  status: ServiceStatus;
  priority: 'Low' | 'Medium' | 'High';
  assignedTo: string;
  createdAt: string;
  lastUpdated: string;
  history: Array<{
    date: string;
    action: string;
    user: string;
  }>;
}

export const MOCK_REQUESTS: ServiceRequest[] = [
  {
    id: 'SR-1001',
    title: 'Network connectivity issues in South Wing',
    customer: 'Tech Corp',
    description: 'The South Wing has been reporting intermittent Wi-Fi drops since early morning. Several staff members are unable to connect to the VPN, causing significant workflow disruptions. We have tried restarting the local access points but the issue persists. The signal strength appears normal on the dashboard, but packet loss is exceeding 30%.',
    status: 'In Progress',
    priority: 'High',
    assignedTo: 'Alex Chen',
    createdAt: '2024-03-20T08:30:00Z',
    lastUpdated: '2024-03-20T10:15:00Z',
    history: [
      { date: '2024-03-20T08:30:00Z', action: 'Request created', user: 'System' },
      { date: '2024-03-20T09:00:00Z', action: 'Assigned to Alex Chen', user: 'Manager' },
      { date: '2024-03-20T10:15:00Z', action: 'Status changed to In Progress', user: 'Alex Chen' }
    ]
  },
  {
    id: 'SR-1002',
    title: 'Software update failed on workstation #42',
    customer: 'Design Studio',
    description: 'A mandatory security patch was initiated last night but failed with error code 0x80070005. The workstation is now stuck in a boot loop and cannot reach the login screen. This is a primary machine for the creative lead, so resolution is needed as soon as possible to avoid project delays.',
    status: 'Urgent',
    priority: 'High',
    assignedTo: 'Sarah Miller',
    createdAt: '2024-03-19T16:45:00Z',
    lastUpdated: '2024-03-20T09:00:00Z',
    history: [
      { date: '2024-03-19T16:45:00Z', action: 'Request created', user: 'Creative Lead' },
      { date: '2024-03-20T09:00:00Z', action: 'Marked as Urgent', user: 'Manager' }
    ]
  },
  {
    id: 'SR-1003',
    title: 'New employee onboarding - Hardware Setup',
    customer: 'HR Department',
    description: 'New developer starting next Monday. Need standard laptop setup (MacBook Pro), two monitors, keyboard, mouse, and docking station. All equipment should be configured with the standard engineering image and developer tools pre-installed.',
    status: 'Pending',
    priority: 'Medium',
    assignedTo: 'Unassigned',
    createdAt: '2024-03-20T11:00:00Z',
    lastUpdated: '2024-03-20T11:00:00Z',
    history: [
      { date: '2024-03-20T11:00:00Z', action: 'Request created', user: 'HR System' }
    ]
  },
  {
    id: 'SR-1004',
    title: 'Printer paper jam in Finance office',
    customer: 'Finance Team',
    description: 'The main printer in the Finance office has a severe paper jam that seems to be in the fuser area. We cannot reach the paper without opening components we are not familiar with. Printing is currently disabled for the entire team.',
    status: 'Completed',
    priority: 'Low',
    assignedTo: 'John Doe',
    createdAt: '2024-03-19T10:00:00Z',
    lastUpdated: '2024-03-19T14:30:00Z',
    history: [
      { date: '2024-03-19T10:00:00Z', action: 'Request created', user: 'Finance Clerk' },
      { date: '2024-03-19T14:30:00Z', action: 'Status changed to Completed', user: 'John Doe' }
    ]
  }
];
