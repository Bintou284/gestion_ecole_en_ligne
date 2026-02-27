import { useState, useEffect } from "react";
import type { SlotEvent, Teacher, Formation, Course, FormData } from "../types/planning.types";

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/api`;

export function usePlanningData() {
  const [events, setEvents] = useState<SlotEvent[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [formations, setFormations] = useState<Formation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  // Gestion token expiré
  const handleTokenExpired = () => {
    localStorage.removeItem("token");
    setError("Session expirée. Redirection vers la page de connexion...");
    setTimeout(() => {
      window.location.href = "/login";
    }, 2000);
  };

  // Fetch tous les créneaux
  const fetchSlots = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/schedule/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        handleTokenExpired();
        return;
      }
      if (!res.ok) throw new Error("Erreur serveur");
      const data = await res.json();

      const formatted: SlotEvent[] = data.map((slot: any) => ({
        slot_id: slot.slot_id,
        title: slot.courses?.title || "Cours sans titre",
        start: new Date(slot.start_time),
        end: new Date(slot.end_time),
        categorie: slot.courses?.course_type || "Cours",
        room: slot.room || "Non définie",
        teacher: slot.users_schedule_slots_teacher_idTousers
          ? `${slot.users_schedule_slots_teacher_idTousers.first_name} ${slot.users_schedule_slots_teacher_idTousers.last_name}`
          : "Non assigné",
        course_id: slot.course_id,
        formation_id: slot.formation_id,
        teacher_id: slot.teacher_id,
      }));

      setEvents(formatted);
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les créneaux");
    } finally {
      setLoading(false);
    }
  };

  // Fetch professeurs
  const fetchTeachers = async () => {
    try {
      const res = await fetch(`${API_URL}/teachers/teachers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return;
      if (res.ok) {
        const data = await res.json();
        setTeachers(data);
      }
    } catch (err) {
      console.error("Erreur teachers:", err);
    }
  };

  // Fetch formations
  const fetchFormations = async () => {
    try {
      const res = await fetch(`${API_URL}/formations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return;
      if (res.ok) {
        const data = await res.json();
        const formattedData = data.map((f: any) => ({
          formation_id: f.id || f.formation_id,
          title: f.title,
          level: f.level || null,
        }));
        setFormations(formattedData);
      }
    } catch (err) {
      console.error("Erreur formations:", err);
    }
  };

  // Fetch tous les cours
  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_URL}/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) return;
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error("Erreur courses:", err);
    }
  };

  // Fetch cours par formation
  const fetchCoursesByFormation = async (formationId: string) => {
    try {
      const res = await fetch(`${API_URL}/formations/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const allCourses = await res.json();
        const filtered = allCourses.filter((course: any) =>
          course.formation_courses?.some(
            (fc: any) => fc.formations.formation_id === Number(formationId)
          )
        );

        const formattedCourses = filtered.map((course: any) => ({
          course_id: course.course_id,
          title: course.title,
          course_type: course.course_type || null,
        }));

        setFilteredCourses(formattedCourses);
      }
    } catch (err) {
      console.error("Erreur courses par formation:", err);
      setFilteredCourses([]);
    }
  };

  // Calcul des créneaux récurrents
  const calculateRecurringSlots = (
    formData: FormData,
    startDateTime: Date,
    endDateTime: Date
  ) => {
    const slots = [];
    const weekInterval =
      formData.recurrence_type === "weekly" ? 1 :
      formData.recurrence_type === "biweekly" ? 2 :
      formData.recurrence_type === "triweekly" ? 3 : 0;

    const isMonthly = formData.recurrence_type === "monthly";

    for (let i = 0; i < (formData.is_recurring ? formData.recurrence_count : 1); i++) {
      let newStartDate = new Date(startDateTime);
      let newEndDate = new Date(endDateTime);

      if (i > 0) {
        if (isMonthly) {
          if (formData.recurrence_mode === "day") {
            const targetDayOfWeek = startDateTime.getDay();
            newStartDate.setMonth(newStartDate.getMonth() + i);
            newEndDate.setMonth(newEndDate.getMonth() + i);

            const firstDayOfMonth = new Date(newStartDate.getFullYear(), newStartDate.getMonth(), 1);
            const firstTargetDay = new Date(firstDayOfMonth);
            const daysUntilTarget = (targetDayOfWeek - firstDayOfMonth.getDay() + 7) % 7;
            firstTargetDay.setDate(1 + daysUntilTarget);

            const originalDate = startDateTime.getDate();
            const weekNumber = Math.floor((originalDate - firstTargetDay.getDate()) / 7);

            newStartDate.setDate(firstTargetDay.getDate() + (weekNumber * 7));
            newEndDate.setDate(firstTargetDay.getDate() + (weekNumber * 7));
            
            newStartDate.setHours(startDateTime.getHours(), startDateTime.getMinutes());
            newEndDate.setHours(endDateTime.getHours(), endDateTime.getMinutes());
          } else {
            const targetDate = startDateTime.getDate();
            newStartDate.setMonth(newStartDate.getMonth() + i);
            newEndDate.setMonth(newEndDate.getMonth() + i);
            
            const lastDayOfMonth = new Date(newStartDate.getFullYear(), newStartDate.getMonth() + 1, 0).getDate();
            
            if (targetDate > lastDayOfMonth) {
              continue;
            }
            
            newStartDate.setDate(targetDate);
            newEndDate.setDate(targetDate);
          }
        } else {
          newStartDate.setDate(newStartDate.getDate() + (weekInterval * 7 * i));
          newEndDate.setDate(newEndDate.getDate() + (weekInterval * 7 * i));
        }
      }

      slots.push({
        start_time: newStartDate.toISOString(),
        end_time: newEndDate.toISOString(),
      });
    }

    return slots;
  };

  // Sauvegarder/Créer un créneau
  const handleSaveSlot = async (
    formData: FormData,
    modalMode: "create" | "edit",
    currentSlot: SlotEvent | null
  ) => {
    try {
      if (!formData.course_id) {
        setError("Veuillez sélectionner un cours");
        return false;
      }
      
      if (!formData.room || formData.room.trim() === "") {
        setError("Veuillez renseigner une salle");
        return false;
      }

      const startDateTime = new Date(`${formData.date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.date}T${formData.end_time}`);
      
      const basePayload = {
        course_id: formData.course_id ? Number(formData.course_id) : null,
        formation_id: formData.formation_id ? Number(formData.formation_id) : null,
        teacher_id: formData.teacher_id ? Number(formData.teacher_id) : null,
        room: formData.room || null,
      };

      if (modalMode === "edit") {
        const url = `${API_URL}/schedule/${currentSlot?.slot_id}`;
        const res = await fetch(url, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...basePayload,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
          }),
        });

        if (!res.ok) throw new Error("Erreur enregistrement");
      } else {
        const recurringSlots = calculateRecurringSlots(formData, startDateTime, endDateTime);
        
        const promises = recurringSlots.map((slot) =>
          fetch(`${API_URL}/schedule`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ...basePayload,
              ...slot,
            }),
          })
        );

        const results = await Promise.all(promises);
        const failedCount = results.filter((r) => !r.ok).length;

        if (failedCount > 0) {
          setError(`${failedCount} créneaux n'ont pas pu être créés`);
        }
      }

      setError(null);
      await fetchSlots();
      return true;
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'enregistrement");
      return false;
    }
  };

  // Supprimer un créneau
  const handleDeleteSlot = async (slotId: number) => {
    try {
      const res = await fetch(`${API_URL}/schedule/${slotId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Erreur suppression");

      await fetchSlots();
      return true;
    } catch (err) {
      console.error(err);
      setError("Erreur lors de la suppression");
      return false;
    }
  };

  // Chargement initial
  useEffect(() => {
    if (!token) {
      setError("Vous devez être connecté pour accéder à cette page.");
      setLoading(false);
      return;
    }
    
    Promise.all([
      fetchSlots(),
      fetchTeachers(),
      fetchFormations(),
      fetchCourses(),
    ]);
  }, []);

  return {
    events,
    teachers,
    formations,
    courses,
    filteredCourses,
    loading,
    error,
    setError,
    fetchSlots,
    fetchCoursesByFormation,
    handleSaveSlot,
    handleDeleteSlot,
  };
}