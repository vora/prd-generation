import React from "react";

export default function SimplePreview() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Browser Header */}
      <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="bg-white px-3 py-1 rounded text-sm text-gray-600 ml-4">
          🌐 Broker Mobile App for HealthSecure Insurance - Live Preview
        </div>
      </div>

      {/* App Content */}
      <div className="bg-white">
        {/* App Navigation */}
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-900">Broker Mobile App for HealthSecure Insurance</h1>
            <nav className="flex space-x-4">
              <span className="text-blue-600 border-b-2 border-blue-600 pb-1">Dashboard</span>
              <span className="text-gray-600 hover:text-gray-900 pb-1 cursor-pointer">Book of Business</span>
              <span className="text-gray-600 hover:text-gray-900 pb-1 cursor-pointer">Client Communication</span>
              <span className="text-gray-600 hover:text-gray-900 pb-1 cursor-pointer">Claims Processing</span>
            </nav>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Broker Dashboard</h1>
            <p className="text-gray-600">Welcome to your professional insurance broker application</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border">
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
              <p className="text-sm text-green-600">+5.2% this month</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <p className="text-sm font-medium text-gray-600">Active Policies</p>
              <p className="text-2xl font-bold text-gray-900">856</p>
              <p className="text-sm text-blue-600">+2.1% this month</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">$287,450</p>
              <p className="text-sm text-green-600">+8.7% this month</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
              <p className="text-sm font-medium text-gray-600">Claims Processed</p>
              <p className="text-2xl font-bold text-gray-900">124</p>
              <p className="text-sm text-gray-600">This month</p>
            </div>
          </div>

          {/* Client Management Table */}
          <div className="bg-white rounded-lg shadow border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Client Management</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Add New Client</button>
              </div>
              <div className="flex items-center gap-4">
                <input 
                  type="text" 
                  placeholder="Search clients by name, policy, or status..." 
                  className="px-4 py-2 border rounded-lg flex-1 max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select className="px-4 py-2 border rounded-lg">
                  <option>All Statuses</option>
                  <option>Active</option>
                  <option>Pending</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policy Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premium</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">JS</div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">John Smith</p>
                          <p className="text-sm text-gray-500">john.smith@email.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">Health Plus Premium</td>
                    <td className="px-6 py-4 text-sm text-gray-900">$2,450/year</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                      <button className="text-gray-600 hover:text-gray-900">Edit</button>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">SJ</div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">Sarah Johnson</p>
                          <p className="text-sm text-gray-500">sarah.j@email.com</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">Family Care Standard</td>
                    <td className="px-6 py-4 text-sm text-gray-900">$3,200/year</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                      <button className="text-gray-600 hover:text-gray-900">Edit</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Panel */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h4 className="font-semibold text-blue-900 mb-2">💡 This is Your Live Broker Mobile App!</h4>
            <p className="text-blue-800 text-sm">
              This shows exactly how your HealthSecure Insurance broker application will look and work. 
              Features include: Book of Business Management, Client Communication, and Claims Processing - 
              all built from your uploaded conversation. Perfect for showing to stakeholders!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}