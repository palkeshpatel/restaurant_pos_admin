"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Grid,
  Paper,
  useMediaQuery,
  useTheme,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  LinearProgress,
  Tabs,
  Tab,
  Checkbox,
  ListItemText,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
  Snackbar,
} from "@mui/material";
import {
  Edit as EditIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import api from "../../services/api";

export default function MenuManagement() {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState([]); // All categories including sub-categories
  const [allItems, setAllItems] = useState([]); // All menu items
  const [categories, setCategories] = useState([]); // Parent categories only
  const [subCategories, setSubCategories] = useState([]); // All sub-categories
  const [items, setItems] = useState([]); // All menu items
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const [menus, setMenus] = useState([]);
  const [selectedMenuId, setSelectedMenuId] = useState(null);
  const [menuTypes, setMenuTypes] = useState([]);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(null); // 'category', 'subcategory', 'item'
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);

  // Add from existing dialog states
  const [openAddFromExistingDialog, setOpenAddFromExistingDialog] =
    useState(false);
  const [existingMenuItems, setExistingMenuItems] = useState([]);
  const [selectedExistingItems, setSelectedExistingItems] = useState([]);
  const [loadingExistingItems, setLoadingExistingItems] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Set first category as expanded by default when existingMenuItems change
  useEffect(() => {
    if (existingMenuItems.length > 0 && Object.keys(expandedCategories).length === 0) {
      // Group items by menu_type_id to find first category
      const groupedItems = existingMenuItems.reduce((acc, item) => {
        const typeId = item.menu_type_id || 'uncategorized';
        if (!acc[typeId]) {
          acc[typeId] = [];
        }
        acc[typeId].push(item);
        return acc;
      }, {});

      // Get sorted category keys
      const categoryKeys = Object.keys(groupedItems).sort((a, b) => {
        const typeA = menuTypes.find(t => t.id === parseInt(a));
        const typeB = menuTypes.find(t => t.id === parseInt(b));
        if (!typeA && !typeB) return 0;
        if (!typeA) return 1;
        if (!typeB) return -1;
        return typeA.name.localeCompare(typeB.name);
      });

      // Set first category as expanded
      if (categoryKeys.length > 0) {
        setExpandedCategories({ [categoryKeys[0]]: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingMenuItems, menuTypes]);

  // Modifier/Decision states for item dialog
  const [useModifier, setUseModifier] = useState(true); // true = Modifier, false = Decision
  const [selectedModifierGroups, setSelectedModifierGroups] = useState([]);
  const [selectedDecisionGroups, setSelectedDecisionGroups] = useState([]);
  const [availableModifierGroups, setAvailableModifierGroups] = useState([]);
  const [availableDecisionGroups, setAvailableDecisionGroups] = useState([]);

  // Modifier/Decision dialog states (for settings icon)
  const [openModifierDialog, setOpenModifierDialog] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [modifierGroups, setModifierGroups] = useState([]);
  const [decisionGroups, setDecisionGroups] = useState([]);
  const [loadingModifiers, setLoadingModifiers] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0 = Modifier, 1 = Decision

  const isMountedRef = useRef(true);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    fetchAllData();
    fetchMenuTypes();
    fetchModifierAndDecisionGroups();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch menu items when selectedMenuId changes
  useEffect(() => {
    if (selectedMenuId) {
      fetchMenuItems(selectedMenuId);
    } else {
      setAllItems([]);
    }
  }, [selectedMenuId]);

  useEffect(() => {
    if (selectedMenuId && allCategories.length > 0) {
      // Filter parent categories (no parent_id) for selected menu
      const parentCategories = allCategories.filter(
        (cat) =>
          (!cat.parent_id || cat.parent_id === null) &&
          cat.menu_id == selectedMenuId
      );
      setCategories(parentCategories);

      // Auto-select first category if none is selected
      if (parentCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(parentCategories[0]);
      }
    } else {
      setCategories([]);
    }
  }, [selectedMenuId, allCategories]);

  // Separate effect for sub-categories and auto-selection
  useEffect(() => {
    if (selectedMenuId && allCategories.length > 0) {
      // Filter sub-categories: if a category is selected, show only its sub-categories
      // Otherwise show all sub-categories for the menu
      if (selectedCategory) {
        const subs = allCategories.filter(
          (cat) =>
            cat.parent_id == selectedCategory.id &&
            cat.menu_id == selectedMenuId
        );
        setSubCategories(subs);

        // Auto-select first sub-category if none is selected
        if (subs.length > 0 && !selectedSubCategory) {
          setSelectedSubCategory(subs[0]);
        } else if (subs.length === 0) {
          // Clear sub-category selection if no sub-categories exist
          setSelectedSubCategory(null);
        }
      } else {
        const subs = allCategories.filter(
          (cat) => cat.parent_id && cat.menu_id == selectedMenuId
        );
        setSubCategories(subs);
        setSelectedSubCategory(null);
      }
    } else {
      setSubCategories([]);
      setSelectedSubCategory(null);
    }
  }, [selectedMenuId, allCategories, selectedCategory]);

  useEffect(() => {
    if (selectedMenuId && allItems.length > 0 && allCategories.length > 0) {
      let filteredItems = [];

      // If a sub-category is selected, show only items for that sub-category
      if (selectedSubCategory) {
        filteredItems = allItems.filter(
          (item) => item.menu_category_id == selectedSubCategory.id
        );
      }
      // If a category is selected (but no sub-category), show items for all its sub-categories
      else if (selectedCategory) {
        const subCategoryIds = allCategories
          .filter(
            (cat) =>
              cat.parent_id == selectedCategory.id &&
              cat.menu_id == selectedMenuId
          )
          .map((cat) => cat.id);

        filteredItems = allItems.filter((item) =>
          subCategoryIds.includes(item.menu_category_id)
        );
      }
      // If no selection, show all items for the menu
      else {
        const menuCategoryIds = allCategories
          .filter((cat) => cat.menu_id == selectedMenuId)
          .map((cat) => cat.id);

        filteredItems = allItems.filter((item) =>
          menuCategoryIds.includes(item.menu_category_id)
        );
      }

      setItems(filteredItems);
    } else {
      setItems([]);
    }
  }, [
    selectedMenuId,
    allItems,
    allCategories,
    selectedCategory,
    selectedSubCategory,
  ]);

  const fetchMenuItems = async (menuId = null) => {
    try {
      const params = { per_page: 1000 };
      if (menuId) {
        params.menu_id = menuId;
      }

      const itemsRes = await api
        .get("/admin/menu-items", { params })
        .catch(() => ({ data: { data: { data: [] } } }));

      if (isMountedRef.current) {
        const itemsData = itemsRes.data.data?.data || itemsRes.data.data || [];
        setAllItems(Array.isArray(itemsData) ? itemsData : []);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const fetchAllData = async () => {
    if (fetchInProgressRef.current) return;
    fetchInProgressRef.current = true;
    setLoading(true);
    try {
      const [menusRes, categoriesRes] = await Promise.all([
        api.get("/admin/menus").catch(() => ({ data: { data: { data: [] } } })),
        api
          .get("/admin/menu-categories", { params: { per_page: 1000 } })
          .catch(() => ({ data: { data: [] } })),
      ]);

      if (isMountedRef.current) {
        const menusData = menusRes.data.data?.data || menusRes.data.data || [];
        const categoriesData =
          categoriesRes.data.data?.data || categoriesRes.data.data || [];

        setMenus(Array.isArray(menusData) ? menusData : []);
        setAllCategories(Array.isArray(categoriesData) ? categoriesData : []);

        // Set default menu if available
        if (menusData.length > 0 && !selectedMenuId) {
          const firstMenu = menusData[0];
          setSelectedMenuId(firstMenu.id);
          // Store selected menu name in localStorage for sidebar
          localStorage.setItem("selectedMenuName", firstMenu.name);
          // Dispatch custom event for same-window updates
          window.dispatchEvent(new Event("menuNameChanged"));
          // Fetch items for the selected menu
          await fetchMenuItems(firstMenu.id);
        } else if (selectedMenuId) {
          // Fetch items for the already selected menu
          await fetchMenuItems(selectedMenuId);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      fetchInProgressRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const fetchMenuTypes = async () => {
    try {
      const response = await api.get("/admin/menu-types", {
        params: { per_page: 1000 },
      });
      const typesData = response.data.data?.data || response.data.data || [];
      setMenuTypes(Array.isArray(typesData) ? typesData : []);
    } catch (error) {
      console.error("Error fetching menu types:", error);
    }
  };

  const fetchExistingMenuItems = async () => {
    if (!selectedMenuId) {
      setError("Please select a menu first");
      return;
    }

    setLoadingExistingItems(true);
    try {
      const params = {
        per_page: 1000,
        menu_id: selectedMenuId,
      };

      const response = await api.get("/admin/menu-items", { params });
      const itemsData = response.data.data?.data || response.data.data || [];

      // Filter out items that already belong to the selected sub-category
      const filteredItems = Array.isArray(itemsData)
        ? itemsData.filter(
            (item) => item.menu_category_id !== selectedSubCategory?.id
          )
        : [];

      setExistingMenuItems(filteredItems);
    } catch (error) {
      console.error("Error fetching existing menu items:", error);
      setError("Failed to load existing menu items");
    } finally {
      setLoadingExistingItems(false);
    }
  };

  const handleOpenAddFromExisting = () => {
    if (!selectedSubCategory) {
      alert("Please select a sub-category first");
      return;
    }
    setSelectedExistingItems([]);
    setExpandedCategories({}); // Reset expanded categories when opening dialog
    setOpenAddFromExistingDialog(true);
    fetchExistingMenuItems();
  };

  const toggleCategory = (typeId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [typeId]: prev[typeId] === undefined ? false : !prev[typeId],
    }));
  };

  const handleAddFromExisting = async () => {
    if (selectedExistingItems.length === 0) {
      setError("Please select at least one item");
      return;
    }

    if (!selectedSubCategory) {
      setError("Please select a sub-category first");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const promises = selectedExistingItems.map(async (item) => {
        // Create a new item based on the existing one, but with the new menu_category_id
        const payload = {
          menu_id: selectedMenuId,
          menu_category_id: selectedSubCategory.id,
          menu_type_id: item.menu_type_id,
          name: item.name,
          price_cash: item.price_cash || 0,
          price_card: item.price_card || item.price_cash || 0,
          image: item.image ? item.image : "",
          icon_image: item.icon_image ? item.icon_image : "",
          is_active: item.is_active !== undefined ? item.is_active : true,
          is_auto_fire:
            item.is_auto_fire !== undefined ? item.is_auto_fire : false,
          is_open_item:
            item.is_open_item !== undefined ? item.is_open_item : false,
          printer_route_id: item.printer_route_id || null,
        };

        // Ensure image and icon_image are never null - use empty string
        if (!payload.image) payload.image = "";
        if (!payload.icon_image) payload.icon_image = "";

        const response = await api.post("/admin/menu-items", payload);
        const newItemId = response.data?.data?.id || response.data?.id;

        // If the original item had modifier/decision groups, copy them
        if (
          newItemId &&
          item.modifier_groups &&
          item.modifier_groups.length > 0
        ) {
          const modifierGroupIds = item.modifier_groups.map((g) => g.id || g);
          await api.post(
            `/admin/menu-items/${newItemId}/attach-modifier-groups`,
            {
              modifier_group_ids: modifierGroupIds,
            }
          );
        }

        if (
          newItemId &&
          item.decision_groups &&
          item.decision_groups.length > 0
        ) {
          const decisionGroupIds = item.decision_groups.map((g) => g.id || g);
          await api.post(
            `/admin/menu-items/${newItemId}/attach-decision-groups`,
            {
              decision_group_ids: decisionGroupIds,
            }
          );
        }

        return response;
      });

      await Promise.all(promises);

      setOpenAddFromExistingDialog(false);
      setSelectedExistingItems([]);

      // Refresh menu items
      if (selectedMenuId) {
        await fetchMenuItems(selectedMenuId);
      }

      alert(`Successfully added ${selectedExistingItems.length} item(s)`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add items");
    } finally {
      setSaving(false);
    }
  };

  const fetchModifierAndDecisionGroups = async () => {
    try {
      const [modifierGroupsRes, decisionGroupsRes] = await Promise.all([
        api
          .get("/admin/modifier-groups", { params: { per_page: 1000 } })
          .catch(() => ({ data: { data: { data: [] } } })),
        api
          .get("/admin/decision-groups", { params: { per_page: 1000 } })
          .catch(() => ({ data: { data: [] } })),
      ]);

      const modifierData =
        modifierGroupsRes.data.data?.data || modifierGroupsRes.data.data || [];
      const decisionData =
        decisionGroupsRes.data.data?.data || decisionGroupsRes.data.data || [];

      setAvailableModifierGroups(
        Array.isArray(modifierData) ? modifierData : []
      );
      setAvailableDecisionGroups(
        Array.isArray(decisionData) ? decisionData : []
      );
    } catch (error) {
      console.error("Error fetching modifier/decision groups:", error);
    }
  };

  const handleOpenAdd = (type) => {
    setDialogType(type);
    setEditingItem(null);
    if (type === "category") {
      setFormData({
        menu_id: selectedMenuId,
        name: "",
        description: "",
        is_active: true,
      });
    } else if (type === "subcategory") {
      setFormData({
        menu_id: selectedMenuId,
        parent_id: selectedCategory?.id || "", // Pre-fill with selected category
        name: "",
        description: "",
        is_active: true,
      });
    } else if (type === "item") {
      setFormData({
        menu_id: selectedMenuId || "", // Include menu_id
        menu_category_id: selectedSubCategory?.id || "", // Pre-fill with selected sub-category
        menu_type_id: "",
        name: "",
        price_cash: 0,
        is_active: true,
        is_open_item: false,
      });
      setUseModifier(true);
      setSelectedModifierGroups([]);
      setSelectedDecisionGroups([]);
    }
    setError("");
    setOpenDialog(true);
  };

  const handleOpenEdit = async (type, item) => {
    setDialogType(type);
    setEditingItem(item);
    if (type === "category" || type === "subcategory") {
      setFormData({
        menu_id: item.menu_id || selectedMenuId,
        parent_id: item.parent_id || "",
        name: item.name || "",
        description: item.description || "",
        is_active: item.is_active !== undefined ? item.is_active : true,
      });
    } else if (type === "item") {
      setFormData({
        menu_id: item.menu_id || selectedMenuId || "", // Include menu_id
        menu_category_id: item.menu_category_id || "",
        menu_type_id: item.menu_type_id || "",
        name: item.name || "",
        price_cash: item.price_cash || 0,
        is_active: item.is_active !== undefined ? item.is_active : true,
        is_open_item:
          item.is_open_item !== undefined ? item.is_open_item : false,
      });

      // Fetch full item details with modifier/decision groups
      try {
        const itemRes = await api.get(`/admin/menu-items/${item.id}`);
        const fullItem = itemRes.data.data || itemRes.data || item;

        // Match the groups from the item with the available groups by ID
        const itemModifierGroupIds = (fullItem.modifier_groups || []).map(
          (g) => g.id || g
        );
        const itemDecisionGroupIds = (fullItem.decision_groups || []).map(
          (g) => g.id || g
        );

        // Match with available groups, or use item groups directly if available groups not loaded yet
        const matchedModifierGroups =
          availableModifierGroups.length > 0
            ? availableModifierGroups.filter((g) =>
                itemModifierGroupIds.includes(g.id)
              )
            : fullItem.modifier_groups || [];

        const matchedDecisionGroups =
          availableDecisionGroups.length > 0
            ? availableDecisionGroups.filter((g) =>
                itemDecisionGroupIds.includes(g.id)
              )
            : fullItem.decision_groups || [];

        const hasModifiers = matchedModifierGroups.length > 0;
        const hasDecisions = matchedDecisionGroups.length > 0;
        setUseModifier(hasModifiers || !hasDecisions); // Default to modifier if both or neither
        setSelectedModifierGroups(matchedModifierGroups);
        setSelectedDecisionGroups(matchedDecisionGroups);
      } catch (error) {
        console.error("Error loading item details:", error);
        // Fallback to item data without modifier/decision groups
        const hasModifiers =
          item.modifier_groups && item.modifier_groups.length > 0;
        const hasDecisions =
          item.decision_groups && item.decision_groups.length > 0;
        setUseModifier(hasModifiers || !hasDecisions);
        setSelectedModifierGroups(item.modifier_groups || []);
        setSelectedDecisionGroups(item.decision_groups || []);
      }
    }
    setError("");
    setOpenDialog(true);
  };

  const handleClose = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setFormData({});
    setError("");
    setUseModifier(true);
    setSelectedModifierGroups([]);
    setSelectedDecisionGroups([]);
  };

  const handleOpenModifierDialog = async (item) => {
    setSelectedMenuItem(item);
    setLoadingModifiers(true);
    setOpenModifierDialog(true);
    try {
      // Fetch menu item with full details
      const itemRes = await api.get(`/admin/menu-items/${item.id}`);
      const menuItem = itemRes.data.data || itemRes.data;

      // Fetch available groups (API already includes modifiers/decisions via with() relationships)
      const [modifierGroupsRes, decisionGroupsRes] = await Promise.all([
        api
          .get("/admin/modifier-groups", { params: { per_page: 1000 } })
          .catch(() => ({ data: { data: [] } })),
        api
          .get("/admin/decision-groups", { params: { per_page: 1000 } })
          .catch(() => ({ data: { data: [] } })),
      ]);

      const availableMods =
        modifierGroupsRes.data.data?.data || modifierGroupsRes.data.data || [];
      const availableDecs =
        decisionGroupsRes.data.data?.data || decisionGroupsRes.data.data || [];

      setSelectedMenuItem(menuItem);
      setModifierGroups(menuItem.modifier_groups || []);
      setDecisionGroups(menuItem.decision_groups || []);
      setAvailableModifierGroups(availableMods);
      setAvailableDecisionGroups(availableDecs);
    } catch (error) {
      console.error("Error loading modifier/decision data:", error);
      setError("Failed to load modifier/decision data");
    } finally {
      setLoadingModifiers(false);
    }
  };

  const handleCloseModifierDialog = () => {
    setOpenModifierDialog(false);
    setSelectedMenuItem(null);
    setModifierGroups([]);
    setDecisionGroups([]);
    setError("");
    setActiveTab(0);
  };

  const handleTabChange = (event, newValue) => {
    // Simply switch tabs - no confirmation needed
    setActiveTab(newValue);
  };

  const handleSaveModifiers = async () => {
    if (!selectedMenuItem) return;

    setSaving(true);
    setError("");
    try {
      // If modifier groups are selected, clear decision groups and vice versa
      if (modifierGroups.length > 0 && decisionGroups.length > 0) {
        setError(
          "Cannot have both modifiers and decisions. Please choose one."
        );
        setSaving(false);
        return;
      }

      // Always send both requests to ensure proper syncing
      // Extract IDs from selected groups
      const modifierGroupIds = modifierGroups
        .map((g) => g.id || g)
        .filter((id) => id !== null && id !== undefined);
      const decisionGroupIds = decisionGroups
        .map((g) => g.id || g)
        .filter((id) => id !== null && id !== undefined);

      // Send modifier groups (empty array if none selected)
      await api.post(
        `/admin/menu-items/${selectedMenuItem.id}/attach-modifier-groups`,
        {
          modifier_group_ids: modifierGroupIds,
        }
      );

      // Send decision groups (empty array if none selected)
      await api.post(
        `/admin/menu-items/${selectedMenuItem.id}/attach-decision-groups`,
        {
          decision_group_ids: decisionGroupIds,
        }
      );

      handleCloseModifierDialog();
      // Refresh data
      await fetchAllData();
      // Also refresh menu items for the current menu
      if (selectedMenuId) {
        await fetchMenuItems(selectedMenuId);
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");
    try {
      // Validate description for category and subcategory
      if (dialogType === "category" || dialogType === "subcategory") {
        if (!formData.description || formData.description.trim() === "") {
          setError("Description is required");
          setSaving(false);
          return;
        }
      }

      // Validate that only one type is selected for items
      if (dialogType === "item") {
        if (
          selectedModifierGroups.length > 0 &&
          selectedDecisionGroups.length > 0
        ) {
          setError(
            "Cannot have both modifiers and decisions. Please choose one."
          );
          setSaving(false);
          return;
        }
      }

      let endpoint = "";
      let method = "POST";
      let menuItemId = null;

      if (dialogType === "category") {
        endpoint = editingItem
          ? `/admin/menu-categories/${editingItem.id}`
          : "/admin/menu-categories";
        method = editingItem ? "PUT" : "POST";
      } else if (dialogType === "subcategory") {
        endpoint = editingItem
          ? `/admin/menu-categories/${editingItem.id}`
          : "/admin/menu-categories";
        method = editingItem ? "PUT" : "POST";
      } else if (dialogType === "item") {
        endpoint = editingItem
          ? `/admin/menu-items/${editingItem.id}`
          : "/admin/menu-items";
        method = editingItem ? "PUT" : "POST";
      }

      // For items, set price_card equal to price_cash if not already set
      let payload = { ...formData };
      if (dialogType === "item") {
        payload.price_card = payload.price_cash || 0;
      }

      let response;
      if (method === "POST") {
        response = await api.post(endpoint, payload);
        // Response structure: { success: true, data: { id: ... }, message: "..." }
        // So menu item ID is at response.data.data.id
        menuItemId = response.data?.data?.id || null;
        console.log("Created menu item response:", response.data);
        console.log("Extracted menu item ID:", menuItemId);

        if (!menuItemId) {
          console.error(
            "Full response structure:",
            JSON.stringify(response.data, null, 2)
          );
          throw new Error(
            "Failed to extract menu item ID from response. Check console for full response."
          );
        }
      } else {
        response = await api.put(endpoint, payload);
        menuItemId = editingItem?.id;
        console.log("Updated menu item response:", response.data);
        console.log("Using menu item ID:", menuItemId);

        if (!menuItemId) {
          throw new Error("Menu item ID is missing for update");
        }
      }

      // For items, attach modifier/decision groups - wait for all to complete
      if (dialogType === "item" && menuItemId) {
        console.log("Attaching groups to menu item:", menuItemId);
        console.log("Selected modifier groups:", selectedModifierGroups);
        console.log("Selected decision groups:", selectedDecisionGroups);

        const attachPromises = [];

        if (selectedModifierGroups.length > 0) {
          const modifierGroupIds = selectedModifierGroups
            .map((g) => g.id || g)
            .filter((id) => id !== null && id !== undefined);
          console.log("Attaching modifier groups:", modifierGroupIds);
          attachPromises.push(
            api
              .post(`/admin/menu-items/${menuItemId}/attach-modifier-groups`, {
                modifier_group_ids: modifierGroupIds,
              })
              .then((modResponse) => {
                console.log("Modifier groups response:", modResponse.data);
                return modResponse;
              })
          );
          // Clear decision groups
          attachPromises.push(
            api
              .post(`/admin/menu-items/${menuItemId}/attach-decision-groups`, {
                decision_group_ids: [],
              })
              .then((decResponse) => {
                console.log(
                  "Clear decision groups response:",
                  decResponse.data
                );
                return decResponse;
              })
          );
        } else if (selectedDecisionGroups.length > 0) {
          const decisionGroupIds = selectedDecisionGroups
            .map((g) => g.id || g)
            .filter((id) => id !== null && id !== undefined);
          console.log("Attaching decision groups:", decisionGroupIds);
          attachPromises.push(
            api
              .post(`/admin/menu-items/${menuItemId}/attach-decision-groups`, {
                decision_group_ids: decisionGroupIds,
              })
              .then((decResponse) => {
                console.log("Decision groups response:", decResponse.data);
                return decResponse;
              })
          );
          // Clear modifier groups
          attachPromises.push(
            api
              .post(`/admin/menu-items/${menuItemId}/attach-modifier-groups`, {
                modifier_group_ids: [],
              })
              .then((modResponse) => {
                console.log(
                  "Clear modifier groups response:",
                  modResponse.data
                );
                return modResponse;
              })
          );
        } else {
          // Clear both if nothing selected
          console.log("Clearing all groups");
          attachPromises.push(
            api.post(`/admin/menu-items/${menuItemId}/attach-modifier-groups`, {
              modifier_group_ids: [],
            }),
            api.post(`/admin/menu-items/${menuItemId}/attach-decision-groups`, {
              decision_group_ids: [],
            })
          );
        }

        // Wait for all attach calls to complete
        await Promise.all(attachPromises);
        console.log("All group attachments completed successfully");

        // Small delay to ensure database is updated
        await new Promise((resolve) => setTimeout(resolve, 100));
      } else if (dialogType === "item" && !menuItemId) {
        throw new Error("Menu item ID is missing! Cannot attach groups.");
      }

      // Close dialog first
      handleClose();

      // Refresh all data after all operations complete
      // Refresh data after save
      await fetchAllData();
      // Also refresh menu items for the current menu
      if (selectedMenuId) {
        await fetchMenuItems(selectedMenuId);
      }
      console.log("Data refreshed after save");
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (type, item) => {
    try {
      if (type === "category" || type === "subcategory") {
        const response = await api.post(
          `/admin/menu-management/category/${item.id}/toggle-status`
        );
        const updatedCategory = response.data.data || response.data;
        // Update in allCategories
        setAllCategories((prev) =>
          prev.map((cat) =>
            cat.id === item.id
              ? { ...cat, is_active: updatedCategory.is_active }
              : cat
          )
        );
      } else if (type === "item") {
        const response = await api.post(
          `/admin/menu-management/item/${item.id}/toggle-status`
        );
        const updatedItem = response.data.data || response.data;
        // Update in allItems
        setAllItems((prev) =>
          prev.map((menuItem) =>
            menuItem.id === item.id
              ? { ...menuItem, is_active: updatedItem.is_active }
              : menuItem
          )
        );
      }
    } catch (error) {
      console.error(`Error toggling ${type} status:`, error);
      alert(
        `Failed to update ${type} status: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  };

  const handleDeleteClick = (type, item) => {
    setItemToDelete(item);
    setDeleteType(type);
    setError("");
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete || !deleteType) return;

    try {
      if (deleteType === "category" || deleteType === "subcategory") {
        await api.delete(`/admin/menu-categories/${itemToDelete.id}`);
        // Remove from allCategories
        setAllCategories((prev) => prev.filter((cat) => cat.id !== itemToDelete.id));
        // If deleted category was selected, clear selection
        if (selectedCategory?.id === itemToDelete.id) {
          setSelectedCategory(null);
        }
        if (selectedSubCategory?.id === itemToDelete.id) {
          setSelectedSubCategory(null);
        }
      } else if (deleteType === "item") {
        await api.delete(`/admin/menu-items/${itemToDelete.id}`);
        // Remove from allItems
        setAllItems((prev) =>
          prev.filter((menuItem) => menuItem.id !== itemToDelete.id)
        );
      }

      // Refresh data
      await fetchAllData();
      // Also refresh menu items for the current menu
      if (selectedMenuId) {
        await fetchMenuItems(selectedMenuId);
      }
      
      setShowDeleteDialog(false);
      setItemToDelete(null);
      setDeleteType(null);
      setSuccessMessage(`${deleteType} deleted successfully`);
      setShowSuccessSnackbar(true);
    } catch (error) {
      console.error(`Error deleting ${deleteType}:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to delete ${deleteType}`;
      setError(errorMessage);
      // Don't close dialog if there's an error, so user can see the message
    }
  };

  const renderColumn = (title, items, type, onAdd, onEdit, onToggle) => (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {type === "item" && selectedSubCategory && (
            <Button
              variant="outlined"
              size="small"
              onClick={handleOpenAddFromExisting}
              disabled={!selectedSubCategory}
            >
              Add from Existing
            </Button>
          )}
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAdd}
          >
            {type === "item" ? "Add Item" : "Add"}
          </Button>
        </Box>
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto", pr: 1 }}>
        {loading ? (
          <Box
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            p={4}
            sx={{ height: "100%" }}
          >
            <CircularProgress size={40} thickness={4} sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Loading {title.toLowerCase()}...
            </Typography>
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ p: 2 }}>
            {/* Placeholder boxes when empty */}
            {type === "category" && (
              <Card
                sx={{
                  mb: 2,
                  border: "2px dashed",
                  borderColor: "divider",
                  bgcolor: "grey.50",
                  minHeight: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CardContent sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No categories found
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    Click "+ Add" to create a category
                  </Typography>
                </CardContent>
              </Card>
            )}
            {type === "subcategory" && (
              <>
                {!selectedCategory ? (
                  <Card
                    sx={{
                      mb: 2,
                      border: "2px dashed",
                      borderColor: "divider",
                      bgcolor: "grey.50",
                      minHeight: "120px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Select a category first
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1 }}
                      >
                        Choose a category from the left column
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <Card
                    sx={{
                      mb: 2,
                      border: "2px dashed",
                      borderColor: "divider",
                      bgcolor: "grey.50",
                      minHeight: "120px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        No sub-categories found
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1 }}
                      >
                        Click "+ Add" to create a sub-category
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            {type === "item" && (
              <>
                {!selectedSubCategory ? (
                  <Card
                    sx={{
                      mb: 2,
                      border: "2px dashed",
                      borderColor: "divider",
                      bgcolor: "grey.50",
                      minHeight: "120px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        Select a sub-category first
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1 }}
                      >
                        Choose a sub-category from the middle column
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <Card
                    sx={{
                      mb: 2,
                      border: "2px dashed",
                      borderColor: "divider",
                      bgcolor: "grey.50",
                      minHeight: "120px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        No menu items found
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 1 }}
                      >
                        Click "+ Add Item" to create a menu item
                      </Typography>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </Box>
        ) : (
          items.map((item) => (
            <Card
              key={item.id}
              sx={{
                mb: 2,
                cursor:
                  type === "category" || type === "subcategory"
                    ? "pointer"
                    : "default",
                border:
                  (type === "category" && selectedCategory?.id === item.id) ||
                  (type === "subcategory" &&
                    selectedSubCategory?.id === item.id)
                    ? "2px solid"
                    : "1px solid",
                borderColor:
                  (type === "category" && selectedCategory?.id === item.id) ||
                  (type === "subcategory" &&
                    selectedSubCategory?.id === item.id)
                    ? "primary.main"
                    : "divider",
                "&:hover": {
                  boxShadow: 2,
                },
              }}
              onClick={
                type === "category"
                  ? () => {
                      setSelectedCategory(item);
                      setSelectedSubCategory(null); // Reset sub-category selection when category changes
                    }
                  : type === "subcategory"
                  ? () => setSelectedSubCategory(item)
                  : undefined
              }
            >
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  mb={1}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {item.name}
                  </Typography>
                  <Chip
                    label={item.is_active ? "Active" : "Inactive"}
                    color={item.is_active ? "success" : "default"}
                    size="small"
                  />
                </Box>
                {type === "item" && (
                  <>
                    {item.menu_type_id &&
                      (() => {
                        const menuType = menuTypes.find(
                          (type) => type.id === item.menu_type_id
                        );
                        return menuType ? (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            {menuType.name}
                          </Typography>
                        ) : null;
                      })()}
                    {item.price_cash > 0 && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        ${item.price_cash}
                      </Typography>
                    )}
                  </>
                )}
                {type === "category" && item.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {item.description}
                  </Typography>
                )}
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mt={1}
                >
                  <Box display="flex" gap={1}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(type, item);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(type, item);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={
                          item.is_active !== undefined ? item.is_active : true
                        }
                        onChange={(e) => {
                          e.stopPropagation();
                          onToggle(type, item);
                        }}
                        color="primary"
                      />
                    }
                    label={item.is_active ? "Active" : "Inactive"}
                    labelPlacement="start"
                    sx={{ m: 0 }}
                  />
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>
    </Box>
  );

  return (
    <Box>
      {/* Top Loading Bar */}
      {loading && (
        <Box sx={{ width: "100%", mb: 2 }}>
          <LinearProgress
            sx={{
              height: 4,
              borderRadius: 2,
              "& .MuiLinearProgress-bar": {
                borderRadius: 2,
              },
            }}
          />
        </Box>
      )}

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          Menu Management
          {selectedMenuId && menus.find((m) => m.id === selectedMenuId)
            ? ` - ${menus.find((m) => m.id === selectedMenuId).name}`
            : ""}
        </Typography>
        {menus.length > 0 && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Select Menu</InputLabel>
            <Select
              value={selectedMenuId || ""}
              label="Select Menu"
              onChange={(e) => {
                const menuId = e.target.value;
                setSelectedMenuId(menuId);
                setSelectedCategory(null);
                setSelectedSubCategory(null);
                // Store selected menu name in localStorage for sidebar
                const selectedMenu = menus.find((m) => m.id === menuId);
                if (selectedMenu) {
                  localStorage.setItem("selectedMenuName", selectedMenu.name);
                  // Dispatch custom event for same-window updates
                  window.dispatchEvent(new Event("menuNameChanged"));
                }
              }}
            >
              {menus.map((menu) => (
                <MenuItem key={menu.id} value={menu.id}>
                  {menu.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <Grid
        container
        spacing={2}
        sx={{
          height: { xs: "auto", md: "calc(100vh - 200px)" },
          minHeight: { xs: "auto", md: "600px" },
        }}
      >
        {/* Categories Column */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              height: { xs: "400px", md: "100%" },
              display: "flex",
              flexDirection: "column",
              minHeight: { xs: "400px", md: "auto" },
            }}
          >
            {renderColumn(
              "Categories",
              categories,
              "category",
              () => handleOpenAdd("category"),
              (type, item) => handleOpenEdit("category", item),
              (type, item) => handleToggleActive("category", item)
            )}
          </Paper>
        </Grid>

        {/* Sub-Categories Column */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              height: { xs: "400px", md: "100%" },
              display: "flex",
              flexDirection: "column",
              minHeight: { xs: "400px", md: "auto" },
              opacity: selectedCategory ? 1 : 0.6,
            }}
          >
            {renderColumn(
              "Sub-Categories",
              subCategories,
              "subcategory",
              () => handleOpenAdd("subcategory"),
              (type, item) => handleOpenEdit("subcategory", item),
              (type, item) => handleToggleActive("subcategory", item)
            )}
          </Paper>
        </Grid>

        {/* Items Column */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              height: { xs: "400px", md: "100%" },
              display: "flex",
              flexDirection: "column",
              minHeight: { xs: "400px", md: "auto" },
              opacity: selectedSubCategory ? 1 : 0.6,
            }}
          >
            {renderColumn(
              "Menu Items",
              items,
              "item",
              () => handleOpenAdd("item"),
              (type, item) => handleOpenEdit("item", item),
              (type, item) => handleToggleActive("item", item)
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? `Edit ${dialogType}` : `Add ${dialogType}`}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          <Box sx={{ pt: 2 }}>
            {dialogType === "category" && (
              <>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Description *"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  margin="normal"
                  multiline
                  rows={3}
                  required
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        formData.is_active !== undefined
                          ? formData.is_active
                          : true
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Active"
                  sx={{ mt: 2 }}
                />
              </>
            )}
            {dialogType === "subcategory" && (
              <>
                {/* Always show as label (both add and edit) */}
                {(() => {
                  // When adding: use selectedCategory if available
                  // When editing: find parent category from formData.parent_id
                  const parentCategoryId = editingItem
                    ? formData.parent_id
                    : selectedCategory?.id;
                  const parentCategory = parentCategoryId
                    ? allCategories.find((cat) => cat.id == parentCategoryId)
                    : null;

                  return parentCategory ? (
                    <TextField
                      fullWidth
                      label="Parent Category"
                      value={parentCategory.name}
                      margin="normal"
                      disabled
                      helperText={
                        editingItem
                          ? "Parent category cannot be changed"
                          : "Parent category is automatically set from your selection"
                      }
                    />
                  ) : (
                    <FormControl fullWidth margin="normal">
                      <InputLabel>Parent Category</InputLabel>
                      <Select
                        value={formData.parent_id || ""}
                        label="Parent Category"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            parent_id: e.target.value,
                          })
                        }
                        required
                      >
                        {categories
                          .filter((cat) => cat.menu_id == selectedMenuId)
                          .map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  );
                })()}
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Description *"
                  value={formData.description || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  margin="normal"
                  multiline
                  rows={3}
                  required
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        formData.is_active !== undefined
                          ? formData.is_active
                          : true
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Active"
                  sx={{ mt: 2 }}
                />
              </>
            )}
            {dialogType === "item" && (
              <>
                {/* Category and Sub-Category fields removed - not needed */}
                <TextField
                  fullWidth
                  label="Menu Item Name"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  margin="normal"
                  required
                />
                <FormControl fullWidth margin="normal">
                  <InputLabel>Menu Type (Category)</InputLabel>
                  <Select
                    value={formData.menu_type_id || ""}
                    label="Menu Type (Category)"
                    onChange={(e) =>
                      setFormData({ ...formData, menu_type_id: e.target.value })
                    }
                  >
                    {menuTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Price and Modifier/Decision Selection - Hide if "Open Item" is enabled */}
                {!formData.is_open_item && (
                  <>
                    <TextField
                      fullWidth
                      label="Price"
                      type="number"
                      value={formData.price_cash || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price_cash: parseFloat(e.target.value) || 0,
                        })
                      }
                      margin="normal"
                      required
                    />

                      <Box
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                          p: 2,
                          mt: 2,
                        }}
                      >
                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 2 }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 1,
                              overflow: "hidden",
                              width: "fit-content",
                            }}
                          >
                            <Box
                              component="button"
                              onClick={() => {
                                setUseModifier(true);
                                setSelectedDecisionGroups([]);
                              }}
                              sx={{
                                px: 2,
                                py: 1,
                                border: "none",
                                cursor: "pointer",
                                backgroundColor: useModifier
                                  ? "primary.main"
                                  : "transparent",
                                color: useModifier ? "white" : "text.primary",
                                fontWeight: "medium",
                                fontSize: "0.875rem",
                                transition: "all 0.2s",
                                "&:hover": {
                                  backgroundColor: useModifier
                                    ? "primary.dark"
                                    : "action.hover",
                                },
                              }}
                            >
                              Modifier
                            </Box>
                            <Box
                              sx={{
                                width: "1px",
                                backgroundColor: "divider",
                              }}
                            />
                            <Box
                              component="button"
                              onClick={() => {
                                // Check if modifiers are selected
                                if (selectedModifierGroups.length > 0) {
                                  alert(
                                    "You can select either Modifier or Decision. If you want to select Decision, please unselect Modifier first."
                                  );
                                  return;
                                }
                                setUseModifier(false);
                                setSelectedModifierGroups([]);
                              }}
                              sx={{
                                px: 2,
                                py: 1,
                                border: "none",
                                cursor: "pointer",
                                backgroundColor: !useModifier
                                  ? "primary.main"
                                  : "transparent",
                                color: !useModifier ? "white" : "text.primary",
                                fontWeight: "medium",
                                fontSize: "0.875rem",
                                transition: "all 0.2s",
                                "&:hover": {
                                  backgroundColor: !useModifier
                                    ? "primary.dark"
                                    : "action.hover",
                                },
                              }}
                            >
                              Decision
                            </Box>
                          </Box>
                        </Box>

                        {useModifier ? (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight="bold"
                              sx={{ mb: 1 }}
                            >
                              Select Modifier Groups:
                            </Typography>
                            {availableModifierGroups.length === 0 ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No modifier groups available
                              </Typography>
                            ) : (
                              <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
                                {availableModifierGroups.map((group) => {
                                  const isSelected =
                                    selectedModifierGroups.some(
                                      (g) => g.id === group.id
                                    );
                                  const groupModifiers = group.modifiers || [];
                                  return (
                                    <Box
                                      key={group.id}
                                      sx={{
                                        mb: 1.5,
                                        p: 1.5,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 1,
                                      }}
                                    >
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={isSelected}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                // Clear decisions when selecting modifier
                                                setSelectedDecisionGroups([]);
                                                setSelectedModifierGroups([
                                                  ...selectedModifierGroups,
                                                  group,
                                                ]);
                                                // If we were on Decision tab, switch to Modifier
                                                if (!useModifier) {
                                                  setUseModifier(true);
                                                }
                                              } else {
                                                setSelectedModifierGroups(
                                                  selectedModifierGroups.filter(
                                                    (g) => g.id !== group.id
                                                  )
                                                );
                                              }
                                            }}
                                          />
                                        }
                                        label={
                                          <Typography
                                            variant="subtitle2"
                                            fontWeight="bold"
                                          >
                                            {group.name}
                                          </Typography>
                                        }
                                      />
                                      {groupModifiers.length > 0 && (
                                        <Box sx={{ ml: 4, mt: 0.5 }}>
                                          {groupModifiers.map((modifier) => (
                                            <Typography
                                              key={modifier.id}
                                              variant="body2"
                                              color="text.secondary"
                                              sx={{ mb: 0.5 }}
                                            >
                                              {modifier.name}
                                            </Typography>
                                          ))}
                                        </Box>
                                      )}
                                    </Box>
                                  );
                                })}
                              </Box>
                            )}
                          </Box>
                        ) : (
                          <Box sx={{ mt: 2 }}>
                            <Typography
                              variant="subtitle2"
                              fontWeight="bold"
                              sx={{ mb: 1 }}
                            >
                              Select Decision Group:
                            </Typography>
                            {availableDecisionGroups.length === 0 ? (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                No decision groups available
                              </Typography>
                            ) : (
                              <Box sx={{ maxHeight: 200, overflowY: "auto" }}>
                                {availableDecisionGroups.map((group) => {
                                  const isSelected =
                                    selectedDecisionGroups.some(
                                      (g) => g.id === group.id
                                    );
                                  const groupDecisions = group.decisions || [];
                                  return (
                                    <Box
                                      key={group.id}
                                      sx={{
                                        mb: 1.5,
                                        p: 1.5,
                                        border: "1px solid",
                                        borderColor: "divider",
                                        borderRadius: 1,
                                      }}
                                    >
                                      <FormControlLabel
                                        control={
                                          <Checkbox
                                            checked={isSelected}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                // Check if modifiers are selected
                                                if (
                                                  selectedModifierGroups.length >
                                                  0
                                                ) {
                                                  alert(
                                                    "You can select either Modifier or Decision. If you want to select Decision, please unselect Modifier first."
                                                  );
                                                  return;
                                                }
                                                // Clear modifiers when selecting decision (only one decision allowed)
                                                setSelectedModifierGroups([]);
                                                setSelectedDecisionGroups([
                                                  group,
                                                ]);
                                                // If we were on Modifier tab, switch to Decision
                                                if (useModifier) {
                                                  setUseModifier(false);
                                                }
                                              } else {
                                                setSelectedDecisionGroups([]);
                                              }
                                            }}
                                          />
                                        }
                                        label={
                                          <Typography
                                            variant="subtitle2"
                                            fontWeight="bold"
                                          >
                                            {group.name}
                                          </Typography>
                                        }
                                      />
                                      {groupDecisions.length > 0 && (
                                        <Box sx={{ ml: 4, mt: 0.5 }}>
                                          {groupDecisions.map((decision) => (
                                            <Typography
                                              key={decision.id}
                                              variant="body2"
                                              color="text.secondary"
                                              sx={{ mb: 0.5 }}
                                            >
                                              {decision.name}
                                            </Typography>
                                          ))}
                                        </Box>
                                      )}
                                    </Box>
                                  );
                                })}
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </>
                  )}

                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        formData.is_active !== undefined
                          ? formData.is_active
                          : true
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Active"
                  sx={{ mt: 2 }}
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        formData.is_open_item !== undefined
                          ? formData.is_open_item
                          : false
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_open_item: e.target.checked,
                        })
                      }
                    />
                  }
                  label="Open Item"
                  sx={{ mt: 1 }}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? (
              <CircularProgress size={20} />
            ) : editingItem ? (
              "Update"
            ) : (
              "Add"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modifier/Decision Management Dialog */}
      <Dialog
        open={openModifierDialog}
        onClose={handleCloseModifierDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Manage Modifiers & Decisions - {selectedMenuItem?.name}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {loadingModifiers ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ pt: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="Modifier Group" />
                <Tab label="Decision Group" />
              </Tabs>

              {/* Modifier Groups Tab Content */}
              {activeTab === 0 && (
                <Box>
                  <Box display="flex" justifyContent="flex-end" mb={2}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        router.push("/admin/modifier-groups");
                      }}
                    >
                      Add Modifier Group
                    </Button>
                  </Box>

                  {availableModifierGroups.map((group) => {
                    const isSelected = modifierGroups.some(
                      (g) => g.id === group.id
                    );
                    const hasDecisions = decisionGroups.length > 0;
                    // Fetch modifiers for this group - we'll need to load them
                    const groupModifiers = group.modifiers || [];

                    return (
                      <Box
                        key={group.id}
                        sx={{
                          mb: 2,
                          p: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => {
                                if (hasDecisions && !isSelected) {
                                  alert(
                                    "Decision is applied. You can give item decision or modifier. If you applied modifier then please remove decision selection."
                                  );
                                  return;
                                }
                                if (e.target.checked) {
                                  // Add to selected groups and clear decisions
                                  setModifierGroups([...modifierGroups, group]);
                                  setDecisionGroups([]);
                                  alert(
                                    `Modifier group "${group.name}" is added to item`
                                  );
                                } else {
                                  // Remove from selected groups
                                  setModifierGroups(
                                    modifierGroups.filter(
                                      (g) => g.id !== group.id
                                    )
                                  );
                                  alert(
                                    `Modifier group "${group.name}" is removed from item`
                                  );
                                }
                              }}
                            />
                          }
                          label={
                            <Typography variant="subtitle1" fontWeight="bold">
                              {group.name}
                            </Typography>
                          }
                        />

                        {/* Always show modifiers when group has them, regardless of selection */}
                        <Box sx={{ ml: 4, mt: 1 }}>
                          {groupModifiers.length > 0 ? (
                            groupModifiers.map((modifier) => (
                              <Typography
                                key={modifier.id}
                                variant="body2"
                                sx={{
                                  mb: 1,
                                  color: isSelected
                                    ? "text.primary"
                                    : "text.secondary",
                                  opacity: isSelected ? 1 : 0.7,
                                }}
                              >
                                {modifier.name}
                              </Typography>
                            ))
                          ) : (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              No modifiers
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}

                  {availableModifierGroups.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: "center", py: 3 }}
                    >
                      No modifier groups available. Click "Add Modifier Group"
                      to create one.
                    </Typography>
                  )}
                </Box>
              )}

              {/* Decision Groups Tab Content */}
              {activeTab === 1 && (
                <Box>
                  <Box display="flex" justifyContent="flex-end" mb={2}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        router.push("/admin/decision-groups");
                      }}
                    >
                      Add Decision Group
                    </Button>
                  </Box>

                  {availableDecisionGroups.map((group) => {
                    const isSelected = decisionGroups.some(
                      (g) => g.id === group.id
                    );
                    const hasModifiers = modifierGroups.length > 0;
                    // Fetch decisions for this group
                    const groupDecisions = group.decisions || [];

                    return (
                      <Box
                        key={group.id}
                        sx={{
                          mb: 2,
                          p: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 1,
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isSelected}
                              onChange={(e) => {
                                if (hasModifiers && !isSelected) {
                                  alert(
                                    "Modifier is applied. You can give item decision or modifier. If you applied decision then please remove modifier selection."
                                  );
                                  return;
                                }
                                if (e.target.checked) {
                                  // Only one decision group allowed, so replace
                                  setDecisionGroups([group]);
                                  setModifierGroups([]);
                                  alert(
                                    `Decision group "${group.name}" is added to item`
                                  );
                                } else {
                                  setDecisionGroups([]);
                                  alert(
                                    `Decision group "${group.name}" is removed from item`
                                  );
                                }
                              }}
                            />
                          }
                          label={
                            <Typography variant="subtitle1" fontWeight="bold">
                              {group.name}
                            </Typography>
                          }
                        />

                        {/* Always show decisions when group has them, regardless of selection */}
                        <Box sx={{ ml: 4, mt: 1 }}>
                          {groupDecisions.length > 0 ? (
                            groupDecisions.map((decision) => (
                              <Typography
                                key={decision.id}
                                variant="body2"
                                sx={{
                                  mb: 1,
                                  color: isSelected
                                    ? "text.primary"
                                    : "text.secondary",
                                  opacity: isSelected ? 1 : 0.7,
                                }}
                              >
                                {decision.name}
                              </Typography>
                            ))
                          ) : (
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mb: 1 }}
                            >
                              No decisions
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}

                  {availableDecisionGroups.length === 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: "center", py: 3 }}
                    >
                      No decision groups available. Click "Add Decision Group"
                      to create one.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModifierDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveModifiers}
            variant="contained"
            disabled={saving || loadingModifiers}
          >
            {saving ? <CircularProgress size={20} /> : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add from Existing Items Dialog */}
      <Dialog
        open={openAddFromExistingDialog}
        onClose={() => {
          setOpenAddFromExistingDialog(false);
          setSelectedExistingItems([]);
          setExpandedCategories({}); // Reset expanded categories when closing dialog
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">
              Add Items from Existing -{" "}
              {menus.find((m) => m.id === selectedMenuId)?.name || "Menu"}
            </Typography>
            {!loadingExistingItems && existingMenuItems.length > 0 && (
              <Chip
                label={`${existingMenuItems.length} item${
                  existingMenuItems.length !== 1 ? "s" : ""
                } available`}
                color="primary"
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          {loadingExistingItems ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              p={4}
            >
              <CircularProgress />
            </Box>
          ) : existingMenuItems.length === 0 ? (
            <Box sx={{ py: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No existing items found for this menu
              </Typography>
            </Box>
          ) : (
            <Box sx={{ mt: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Select items to add to "{selectedSubCategory?.name}"
                  sub-category:
                </Typography>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  {selectedExistingItems.length > 0 && (
                    <Chip
                      label={`${selectedExistingItems.length} selected`}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  )}
                  {existingMenuItems.length > 0 && (
                    <>
                      {selectedExistingItems.length ===
                      existingMenuItems.length ? (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => setSelectedExistingItems([])}
                        >
                          Deselect All
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() =>
                            setSelectedExistingItems([...existingMenuItems])
                          }
                        >
                          Select All
                        </Button>
                      )}
                    </>
                  )}
                </Box>
              </Box>
              <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                {(() => {
                  // Group items by menu_type_id
                  const groupedItems = existingMenuItems.reduce((acc, item) => {
                    const typeId = item.menu_type_id || 'uncategorized';
                    if (!acc[typeId]) {
                      acc[typeId] = [];
                    }
                    acc[typeId].push(item);
                    return acc;
                  }, {});

                  // Get sorted category keys
                  const categoryKeys = Object.keys(groupedItems).sort((a, b) => {
                    const typeA = menuTypes.find(t => t.id === parseInt(a));
                    const typeB = menuTypes.find(t => t.id === parseInt(b));
                    if (!typeA && !typeB) return 0;
                    if (!typeA) return 1;
                    if (!typeB) return -1;
                    return typeA.name.localeCompare(typeB.name);
                  });

                  return categoryKeys.map((typeId, index) => {
                    const items = groupedItems[typeId];
                    const menuType = menuTypes.find((type) => type.id === parseInt(typeId));
                    const categoryName = menuType ? menuType.name : 'Uncategorized';
                    const selectedCount = items.filter(item => 
                      selectedExistingItems.some(selected => String(selected.id) === String(item.id))
                    ).length;
                    // Only first category is expanded by default (when index is 0 and not explicitly set to false)
                    // Other categories need to be explicitly set to true to be expanded
                    const isExpanded = index === 0 
                      ? (expandedCategories[typeId] !== false)
                      : (expandedCategories[typeId] === true);

                    return (
                      <Box 
                        key={typeId} 
                        sx={{ 
                          mb: 2, 
                          p: 2,
                          borderRadius: 2,
                          boxShadow: 2,
                          bgcolor: 'background.paper',
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                            <IconButton 
                              size="small" 
                              onClick={() => toggleCategory(typeId)}
                              sx={{ p: 0.5 }}
                            >
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {categoryName} ({items.length} item{items.length !== 1 ? 's' : ''})
                            </Typography>
                          </Box>
                          {selectedCount > 0 && (
                            <Chip 
                              label={`${selectedCount} selected`}
                              color="primary"
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Collapse in={isExpanded}>
                          <Box>
                            {items.map((item) => {
                            const isSelected = selectedExistingItems.some(
                              (selected) => String(selected.id) === String(item.id)
                            );
                            return (
                              <Box
                                key={item.id}
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  py: 0.75,
                                  px: 1.5,
                                  mb: 0.5,
                                  border: isSelected ? "2px solid" : "1px solid",
                                  borderColor: isSelected ? "primary.main" : "divider",
                                  borderRadius: 1,
                                  cursor: "pointer",
                                  bgcolor: isSelected ? "action.selected" : "transparent",
                                  "&:hover": {
                                    bgcolor: "action.hover",
                                  },
                                }}
                                onClick={() => {
                                  setSelectedExistingItems((prev) => {
                                    if (isSelected) {
                                      return prev.filter(
                                        (i) => String(i.id) !== String(item.id)
                                      );
                                    } else {
                                      const exists = prev.some(
                                        (i) => String(i.id) === String(item.id)
                                      );
                                      if (exists) return prev;
                                      return [...prev, item];
                                    }
                                  });
                                }}
                              >
                                <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                                  <Typography variant="body2" fontWeight="medium" sx={{ minWidth: 150 }}>
                                    {item.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                                    Price: ${item.price_cash || 0}
                                  </Typography>
                                </Box>
                                <Checkbox
                                  checked={isSelected}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setSelectedExistingItems((prev) => {
                                      if (isSelected) {
                                        return prev.filter(
                                          (i) => String(i.id) !== String(item.id)
                                        );
                                      } else {
                                        const exists = prev.some(
                                          (i) => String(i.id) === String(item.id)
                                        );
                                        if (exists) return prev;
                                        return [...prev, item];
                                      }
                                    });
                                  }}
                                  size="small"
                                />
                              </Box>
                            );
                          })}
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  });
                })()}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 3,
            py: 2,
          }}
        >
          <Box>
            {!loadingExistingItems && existingMenuItems.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {selectedExistingItems.length} of {existingMenuItems.length}{" "}
                item{existingMenuItems.length !== 1 ? "s" : ""} selected
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              onClick={() => {
                setOpenAddFromExistingDialog(false);
                setSelectedExistingItems([]);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddFromExisting}
              variant="contained"
              disabled={
                saving ||
                selectedExistingItems.length === 0 ||
                loadingExistingItems
              }
            >
              {saving ? (
                <CircularProgress size={20} />
              ) : (
                `Add ${selectedExistingItems.length} Item${
                  selectedExistingItems.length !== 1 ? "s" : ""
                }`
              )}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => {
        setShowDeleteDialog(false);
        setItemToDelete(null);
        setDeleteType(null);
        setError("");
      }}>
        <DialogTitle>Delete {deleteType === "category" ? "Category" : deleteType === "subcategory" ? "Sub-Category" : "Menu Item"}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Typography>
            Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowDeleteDialog(false);
            setItemToDelete(null);
            setDeleteType(null);
            setError("");
          }}>
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccessSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSuccessSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setShowSuccessSnackbar(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
