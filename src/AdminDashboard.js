// src/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { Box, Typography, Grid, Paper, CircularProgress } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Phone as PhoneIcon,
  History as HistoryIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { searchAuditLogs } from './src-modern/services/auditService';
import { searchContactEvents } from './src-modern/services/contactEventService';

const COLORS = {
  primary: '#667eea',
  secondary: '#764ba2',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
};

const CHART_COLORS = [
  COLORS.primary,
  COLORS.success,
  COLORS.warning,
  COLORS.info,
  COLORS.purple,
  COLORS.pink,
];

const StatCard = ({ title, value, icon, color, trend, subtitle }) => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      border: `1px solid ${color}30`,
      borderRadius: 3,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 24px ${color}25`,
      },
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" sx={{ color: '#64748b' }}>
            {subtitle}
          </Typography>
        )}
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            <TrendingUpIcon sx={{ fontSize: 16, color: COLORS.success }} />
            <Typography variant="caption" sx={{ color: COLORS.success, fontWeight: 600 }}>
              {trend}
            </Typography>
          </Box>
        )}
      </Box>
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${color}20`,
          color: color,
        }}
      >
        {icon}
      </Box>
    </Box>
  </Paper>
);

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAudits: 0,
    totalContacts: 0,
    todayActivity: 0,
    activeUsers: 0,
    totalPeople: 0,
    totalRelationships: 0,
    networkMembers: 0,
    avgConnectionsPerPerson: 0,
    totalHouseholds: 0,
    householdsWithMembers: 0,
    avgHouseholdSize: 0,
  });
  const [activityData, setActivityData] = useState([]);
  const [contactTypeData, setContactTypeData] = useState([]);
  const [actionTypeData, setActionTypeData] = useState([]);
  const [weeklyTrendData, setWeeklyTrendData] = useState([]);
  const [fosterCareData, setFosterCareData] = useState([]);
  const [tagData, setTagData] = useState([]);
  const [roleData, setRoleData] = useState([]);
  const [householdSizeData, setHouseholdSizeData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch audit logs and contact events
      const [auditResult, contactResult] = await Promise.all([
        searchAuditLogs({ dateRange: '30days', limit: 1000 }),
        searchContactEvents({ limit: 1000 }),
      ]);

      const audits = auditResult.data || [];
      const contacts = contactResult.data || [];

      // Load genogram data from localStorage
      const savedData = localStorage.getItem('genogram_autosave');
      const genogramData = savedData ? JSON.parse(savedData) : { people: [], relationships: [], households: [] };
      const people = genogramData.people || [];
      const relationships = genogramData.relationships || [];
      const households = genogramData.households || [];

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayAudits = audits.filter(a => new Date(a.timestamp) >= today);
      const todayContacts = contacts.filter(c => new Date(c.createdAt || c.timestamp) >= today);
      
      const uniqueUsers = new Set([
        ...audits.map(a => a.userId),
        ...contacts.map(c => c.userId || 'anonymous'),
      ]);

      const networkMembers = people.filter(p => p.networkMember).length;
      const avgConnections = people.length > 0 ? (relationships.length * 2) / people.length : 0;

      // Household stats
      const totalHouseholds = households.length;
      const householdsWithMembers = households.filter(h => h.members && h.members.length > 0).length;
      const totalHouseholdMembers = households.reduce((sum, h) => sum + (h.members?.length || 0), 0);
      const avgHouseholdSize = totalHouseholds > 0 ? (totalHouseholdMembers / totalHouseholds).toFixed(1) : 0;

      setStats({
        totalAudits: audits.length,
        totalContacts: contacts.length,
        todayActivity: todayAudits.length + todayContacts.length,
        activeUsers: uniqueUsers.size,
        totalPeople: people.length,
        totalRelationships: relationships.length,
        networkMembers,
        avgConnectionsPerPerson: avgConnections.toFixed(1),
        totalHouseholds,
        householdsWithMembers,
        avgHouseholdSize,
      });

      // Household Size Distribution
      const householdSizeData = {};
      households.forEach(h => {
        const size = h.members?.length || 0;
        if (size > 0) {
          const label = size === 1 ? '1 person' : `${size} people`;
          householdSizeData[label] = (householdSizeData[label] || 0) + 1;
        }
      });
      setHouseholdSizeData(
        Object.entries(householdSizeData)
          .sort((a, b) => {
            const numA = parseInt(a[0]);
            const numB = parseInt(b[0]);
            return numA - numB;
          })
          .map(([size, count]) => ({ size, count }))
      );

      // Foster Care Status breakdown
      const fosterCareStatus = {};
      people.forEach(p => {
        const status = p.fosterCareStatus || 'Not in System';
        fosterCareStatus[status] = (fosterCareStatus[status] || 0) + 1;
      });

      const fosterCareArray = Object.entries(fosterCareStatus)
        .map(([name, value]) => ({ 
          name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
          value 
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6); // Top 6 statuses
      setFosterCareData(fosterCareArray);

      // Tag breakdown
      const tagCounts = {};
      people.forEach(p => {
        if (p.tags && Array.isArray(p.tags)) {
          p.tags.forEach(tag => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      const tagArray = Object.entries(tagCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8); // Top 8 tags
      setTagData(tagArray);

      // Network roles breakdown
      const roleCounts = {};
      people.forEach(p => {
        if (p.networkMember) {
          const role = p.role || 'Unspecified';
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        }
      });

      const roleArray = Object.entries(roleCounts)
        .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }))
        .sort((a, b) => b.value - a.value);
      setRoleData(roleArray);

      // Process activity over last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        date.setHours(0, 0, 0, 0);
        return date;
      });

      const weeklyData = last7Days.map(date => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayAudits = audits.filter(a => {
          const ts = new Date(a.timestamp);
          return ts >= date && ts < nextDate;
        });
        
        const dayContacts = contacts.filter(c => {
          const ts = new Date(c.createdAt || c.timestamp);
          return ts >= date && ts < nextDate;
        });

        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          audits: dayAudits.length,
          contacts: dayContacts.length,
          total: dayAudits.length + dayContacts.length,
        };
      });

      setWeeklyTrendData(weeklyData);

      // Contact type breakdown
      const contactTypes = {};
      contacts.forEach(c => {
        const type = c.contactType || c.type || 'other';
        contactTypes[type] = (contactTypes[type] || 0) + 1;
      });

      setContactTypeData(
        Object.entries(contactTypes).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }))
      );

      // Action type breakdown
      const actionTypes = {};
      audits.forEach(a => {
        const action = a.action || 'unknown';
        actionTypes[action] = (actionTypes[action] || 0) + 1;
      });

      setActionTypeData(
        Object.entries(actionTypes).map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value,
        }))
      );

      // Last 30 days activity for area chart
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        date.setHours(0, 0, 0, 0);
        return date;
      });

      const monthlyData = last30Days.map(date => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayActivity = audits.filter(a => {
          const ts = new Date(a.timestamp);
          return ts >= date && ts < nextDate;
        }).length + contacts.filter(c => {
          const ts = new Date(c.createdAt || c.timestamp);
          return ts >= date && ts < nextDate;
        }).length;

        return {
          date: date.getDate(),
          activity: dayActivity,
        };
      });

      setActivityData(monthlyData);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={48} sx={{ color: COLORS.primary }} />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: '#1e293b', mb: 1 }}>
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time insights into system activity, user engagement, and contact patterns
          </Typography>
        </Box>

        {/* Stat Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total People"
              value={stats.totalPeople}
              icon={<PeopleIcon sx={{ fontSize: 28 }} />}
              color={COLORS.primary}
              subtitle="In genogram"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Relationships"
              value={stats.totalRelationships}
              icon={<TrendingUpIcon sx={{ fontSize: 28 }} />}
              color={COLORS.success}
              subtitle={`${stats.avgConnectionsPerPerson} avg per person`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Network Members"
              value={stats.networkMembers}
              icon={<PeopleIcon sx={{ fontSize: 28 }} />}
              color={COLORS.info}
              subtitle="Active in network"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Today's Activity"
              value={stats.todayActivity}
              icon={<SpeedIcon sx={{ fontSize: 28 }} />}
              color={COLORS.warning}
              subtitle={`${stats.totalAudits} audits, ${stats.totalContacts} contacts`}
            />
          </Grid>
        </Grid>

        {/* Secondary Stats Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Audit Logs"
              value={stats.totalAudits}
              icon={<HistoryIcon sx={{ fontSize: 28 }} />}
              color={COLORS.purple}
              subtitle="Last 30 days"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Contact Events"
              value={stats.totalContacts}
              icon={<PhoneIcon sx={{ fontSize: 28 }} />}
              color={COLORS.success}
              subtitle="All time"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Households"
              value={stats.totalHouseholds}
              icon={<PeopleIcon sx={{ fontSize: 28 }} />}
              color={COLORS.purple}
              subtitle={`${stats.avgHouseholdSize} avg size`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon={<PeopleIcon sx={{ fontSize: 28 }} />}
              color={COLORS.secondary}
              subtitle="Contributors"
            />
          </Grid>
        </Grid>

        {/* Charts Row 1 */}
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {/* Activity Trend (30 days) */}
          <Box sx={{ flex: '1 1 50%' }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', height: '420px' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                Activity Trend (30 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="activity"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorActivity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Box>

          {/* Contact Types Bar */}
          <Box sx={{ flex: '1 1 50%' }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', height: '420px' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                Contact Types
              </Typography>
              {contactTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={contactTypeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="value" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8' }}>
                  <Typography variant="body2">No contact data available</Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>

        {/* Charts Row 2 */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Weekly Comparison */}
          <Grid item xs={12} lg={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                Last 7 Days Comparison
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weeklyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="audits"
                    stroke={COLORS.primary}
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="contacts"
                    stroke={COLORS.success}
                    strokeWidth={3}
                    dot={{ r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Action Types Bar */}
          <Grid item xs={12} lg={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                Audit Actions Breakdown
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={actionTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" style={{ fontSize: 12 }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="value" fill={COLORS.primary} radius={[8, 8, 0, 0]}>
                    {actionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Charts Row 3 - Foster Care & Tags */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Foster Care Status */}
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                Foster Care Status
              </Typography>
              {fosterCareData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={fosterCareData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#94a3b8" style={{ fontSize: 11 }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      style={{ fontSize: 10 }} 
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="value" fill={COLORS.info} radius={[0, 8, 8, 0]}>
                      {fosterCareData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8' }}>
                  <Typography variant="body2">No foster care data available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Top Tags */}
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                Top Tags
              </Typography>
              {tagData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={tagData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#94a3b8" 
                      style={{ fontSize: 10 }} 
                      angle={-45} 
                      textAnchor="end" 
                      height={100}
                      interval={0}
                    />
                    <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="value" fill={COLORS.purple} radius={[8, 8, 0, 0]}>
                      {tagData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8' }}>
                  <Typography variant="body2">No tags available</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Network Roles */}
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                Network Roles
              </Typography>
              {roleData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8' }}>
                  <Typography variant="body2">No network members with roles</Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Household Size Distribution */}
          <Grid item xs={12} lg={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: '#1e293b' }}>
                Household Sizes
              </Typography>
              {householdSizeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={householdSizeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="size" stroke="#94a3b8" style={{ fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Bar dataKey="count" fill={COLORS.purple} radius={[8, 8, 0, 0]}>
                      {householdSizeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: '#94a3b8' }}>
                  <Typography variant="body2">No households with members</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </AdminLayout>
  );
};

export default AdminDashboard;
