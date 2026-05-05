
"use client"

import { useState } from "react";
import { MOCK_REQUESTS, ServiceStatus } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MoreVertical, Eye, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RequestsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ServiceStatus | "All">("All");

  const filteredRequests = MOCK_REQUESTS.filter(req => {
    const matchesSearch = req.title.toLowerCase().includes(search.toLowerCase()) || 
                          req.customer.toLowerCase().includes(search.toLowerCase()) ||
                          req.id.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || req.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-primary">Service Requests</h2>
          <p className="text-muted-foreground mt-1">Manage and track all ongoing service operations.</p>
        </div>
        <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
          + New Request
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search by ID, title, or customer..." 
            className="pl-10 border-none bg-background focus-visible:ring-1 ring-accent"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select 
            className="bg-background border-none text-sm font-medium p-2 rounded-md focus:ring-1 ring-accent outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Urgent">Urgent</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => (
            <div 
              key={req.id} 
              className="bg-white p-5 rounded-xl shadow-sm border border-transparent hover:border-accent/30 transition-all group flex flex-col md:flex-row md:items-center gap-4"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-wider">{req.id}</span>
                  <Badge variant={req.status === 'Urgent' ? 'destructive' : req.status === 'Completed' ? 'outline' : 'secondary'} className="text-[10px]">
                    {req.status}
                  </Badge>
                  <Badge variant="outline" className={`text-[10px] ${req.priority === 'High' ? 'text-destructive' : ''}`}>
                    {req.priority} Priority
                  </Badge>
                </div>
                <h3 className="font-bold text-primary text-lg group-hover:text-accent transition-colors">{req.title}</h3>
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    {req.customer}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    {new Date(req.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4 text-accent" />
                    {req.assignedTo}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="sm" className="hidden sm:flex gap-2">
                  <Link href={`/requests/${req.id}`}>
                    <Eye className="w-4 h-4" /> View Details
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                       <Link href={`/requests/${req.id}`}>View Details</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Update Status</DropdownMenuItem>
                    <DropdownMenuItem>Assign Personnel</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete Request</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-xl">
            <Search className="w-12 h-12 text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-primary">No requests found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
