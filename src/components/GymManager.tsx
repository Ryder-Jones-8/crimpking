'use client';

import React, { useState, useEffect } from 'react';
import { Gym, Wall, Climb } from '@/types';
import { DataRepository } from '@/lib/db/repository';
import QRCodeCard from './QRCodeCard';
import { Plus, Building2, Layers, Compass, Tag, Calendar, Sparkles, RefreshCw } from 'lucide-react';

export default function GymManager() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [climbs, setClimbs] = useState<Climb[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedGymId, setSelectedGymId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'climbs' | 'qr-codes' | 'gyms-walls'>('climbs');

  // New Gym Form State
  const [showGymModal, setShowGymModal] = useState<boolean>(false);
  const [newGymName, setNewGymName] = useState('');
  const [newGymLocation, setNewGymLocation] = useState('');

  // New Wall Form State
  const [showWallModal, setShowWallModal] = useState<boolean>(false);
  const [wallGymId, setWallGymId] = useState('');
  const [newWallName, setNewWallName] = useState('');
  const [newWallDesc, setNewWallDesc] = useState('');

  // New Climb Form State
  const [showClimbModal, setShowClimbModal] = useState<boolean>(false);
  const [climbGymId, setClimbGymId] = useState('');
  const [climbWallId, setClimbWallId] = useState('');
  const [climbName, setClimbName] = useState('');
  const [climbColor, setClimbColor] = useState('Pink');
  const [climbDiscipline, setClimbDiscipline] = useState<'bouldering' | 'sport'>('bouldering');
  const [climbGrade, setClimbGrade] = useState('V4');
  const [climbSetterNotes, setClimbSetterNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const g = await DataRepository.getGyms();
      const w = await DataRepository.getWalls();
      const c = await DataRepository.getClimbs();
      setGyms(g);
      setWalls(w);
      setClimbs(c);

      if (g.length > 0 && !wallGymId) {
        setWallGymId(g[0].id);
        setClimbGymId(g[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync available walls when climbGymId changes
  useEffect(() => {
    const gymWalls = walls.filter(w => w.gym_id === climbGymId);
    if (gymWalls.length > 0) {
      setClimbWallId(gymWalls[0].id);
    } else {
      setClimbWallId('');
    }
  }, [climbGymId, walls]);

  const handleCreateGym = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGymName.trim()) return;
    await DataRepository.createGym({
      name: newGymName,
      location: newGymLocation || 'Main Facility',
    });
    setNewGymName('');
    setNewGymLocation('');
    setShowGymModal(false);
    loadData();
  };

  const handleCreateWall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWallName.trim() || !wallGymId) return;
    await DataRepository.createWall({
      gym_id: wallGymId,
      name: newWallName,
      description: newWallDesc,
    });
    setNewWallName('');
    setNewWallDesc('');
    setShowWallModal(false);
    loadData();
  };

  const handleCreateClimb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!climbName.trim() || !climbGymId || !climbWallId) return;
    
    await DataRepository.createClimb({
      gym_id: climbGymId,
      wall_id: climbWallId,
      name: climbName,
      color: climbColor,
      discipline: climbDiscipline,
      gym_grade: climbGrade,
      setter_notes: climbSetterNotes,
      active_from: new Date().toISOString().split('T')[0],
      active_until: null,
    });

    setClimbName('');
    setClimbSetterNotes('');
    setShowClimbModal(false);
    loadData();
  };

  const filteredClimbs = selectedGymId === 'all'
    ? climbs
    : climbs.filter(c => c.gym_id === selectedGymId);

  return (
    <div className="space-y-5">
      {/* Header & Gym Selector */}
      <div className="flex flex-col gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Gym & Climb Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage gyms, wall zones, active climb inventory, and printable QR tags.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <select
            value={selectedGymId}
            onChange={(e) => setSelectedGymId(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl px-3 py-2.5 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="all">🏢 All Gyms ({climbs.length} climbs)</option>
            {gyms.map(gym => (
              <option key={gym.id} value={gym.id}>
                📍 {gym.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowClimbModal(true)}
            className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 px-3.5 rounded-xl transition shadow-lg shadow-emerald-900/30"
          >
            <Plus className="w-4 h-4" />
            New Climb
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-4 text-xs font-medium overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('climbs')}
          className={`pb-3 flex items-center gap-1.5 whitespace-nowrap transition ${
            activeTab === 'climbs'
              ? 'border-b-2 border-emerald-500 text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Climbs ({filteredClimbs.length})
        </button>

        <button
          onClick={() => setActiveTab('qr-codes')}
          className={`pb-3 flex items-center gap-1.5 whitespace-nowrap transition ${
            activeTab === 'qr-codes'
              ? 'border-b-2 border-emerald-500 text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          QR Tags
        </button>

        <button
          onClick={() => setActiveTab('gyms-walls')}
          className={`pb-3 flex items-center gap-1.5 whitespace-nowrap transition ${
            activeTab === 'gyms-walls'
              ? 'border-b-2 border-emerald-500 text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Gyms & Walls ({gyms.length})
        </button>
      </div>

      {/* TAB 1: CLIMBS GRID */}
      {activeTab === 'climbs' && (
        <div>
          {filteredClimbs.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800 text-slate-400">
              <Compass className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="font-semibold text-slate-300">No climbs found</p>
              <p className="text-xs text-slate-500 mt-1">Create your first climb to generate a QR tag.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredClimbs.map(climb => (
                <div
                  key={climb.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs rounded-full">
                        {climb.gym_grade}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md">
                        {climb.color} holds
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100">{climb.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {climb.gym_name} • {climb.wall_name}
                    </p>

                    {climb.setter_notes && (
                      <p className="text-xs text-slate-300 bg-slate-800/60 rounded-lg p-2.5 mt-3 italic">
                        &quot;{climb.setter_notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Set {climb.active_from}
                    </span>
                    <a
                      href={`/climb/${climb.qr_code_token}`}
                      className="text-emerald-400 hover:underline font-semibold"
                    >
                      View & Rate →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRINTABLE QR CODES */}
      {activeTab === 'qr-codes' && (
        <div className="grid grid-cols-1 gap-5">
          {filteredClimbs.map(climb => (
            <QRCodeCard key={climb.id} climb={climb} />
          ))}
        </div>
      )}

      {/* TAB 3: GYMS & WALLS */}
      {activeTab === 'gyms-walls' && (
        <div className="space-y-5">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => setShowGymModal(true)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Add New Gym
            </button>
            <button
              onClick={() => setShowWallModal(true)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              Add Wall / Zone
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5">
            {gyms.map(gym => {
              const gymWalls = walls.filter(w => w.gym_id === gym.id);
              const gymClimbs = climbs.filter(c => c.gym_id === gym.id);

              return (
                <div key={gym.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-white">{gym.name}</h3>
                      <p className="text-xs text-slate-400">📍 {gym.location}</p>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      {gymClimbs.length} Active Climbs
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Walls / Zones ({gymWalls.length})
                    </h4>
                    {gymWalls.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No walls configured yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2">
                        {gymWalls.map(wall => (
                          <div key={wall.id} className="bg-slate-800/60 p-3 rounded-xl flex items-center justify-between text-xs">
                            <div>
                              <p className="font-semibold text-slate-200">{wall.name}</p>
                              {wall.description && (
                                <p className="text-slate-400 text-[11px] mt-0.5">{wall.description}</p>
                              )}
                            </div>
                            <span className="text-slate-400 text-[11px]">
                              {climbs.filter(c => c.wall_id === wall.id).length} climbs
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE GYM MODAL */}
      {showGymModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 text-white space-y-4">
            <h3 className="text-lg font-bold">Add New Climbing Gym</h3>
            <form onSubmit={handleCreateGym} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Gym Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Earth Treks Columbia"
                  value={newGymName}
                  onChange={e => setNewGymName(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Location / City</label>
                <input
                  type="text"
                  placeholder="e.g. Columbia, MD"
                  value={newGymLocation}
                  onChange={e => setNewGymLocation(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGymModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
                >
                  Save Gym
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE WALL MODAL */}
      {showWallModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 text-white space-y-4">
            <h3 className="text-lg font-bold">Add Wall / Zone</h3>
            <form onSubmit={handleCreateWall} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Gym</label>
                <select
                  value={wallGymId}
                  onChange={e => setWallGymId(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {gyms.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Wall / Sector Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 45° Overhang Cave"
                  value={newWallName}
                  onChange={e => setNewWallName(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Steep power climbs and roof jams"
                  value={newWallDesc}
                  onChange={e => setNewWallDesc(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWallModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl"
                >
                  Save Wall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CLIMB MODAL */}
      {showClimbModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 text-white space-y-4">
            <h3 className="text-lg font-bold">Set New Climb</h3>
            <form onSubmit={handleCreateClimb} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Gym</label>
                  <select
                    value={climbGymId}
                    onChange={e => setClimbGymId(e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  >
                    {gyms.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Wall / Zone</label>
                  <select
                    value={climbWallId}
                    onChange={e => setClimbWallId(e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  >
                    {walls.filter(w => w.gym_id === climbGymId).map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Climb Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cosmic Heel Hook"
                  value={climbName}
                  onChange={e => setClimbName(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Hold Color</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pink"
                    value={climbColor}
                    onChange={e => setClimbColor(e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Stated Grade</label>
                  <select
                    value={climbGrade}
                    onChange={e => setClimbGrade(e.target.value)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  >
                    {['VB', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Discipline</label>
                  <select
                    value={climbDiscipline}
                    onChange={e => setClimbDiscipline(e.target.value as any)}
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="bouldering">Bouldering</option>
                    <option value="sport">Sport Route</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Setter Beta Notes (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. High left foot kick, jump to the top volume."
                  value={climbSetterNotes}
                  onChange={e => setClimbSetterNotes(e.target.value)}
                  className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowClimbModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-lg"
                >
                  Create Climb & Generate QR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
