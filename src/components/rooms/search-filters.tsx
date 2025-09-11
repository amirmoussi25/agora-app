"use client";

import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RoomFilters } from '@/lib/types/room';

interface SearchFiltersProps {
  filters: RoomFilters;
  onFiltersChange: (filters: RoomFilters) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export function SearchFilters({ 
  filters, 
  onFiltersChange, 
  onSearch,
  isLoading = false 
}: SearchFiltersProps) {
  const updateFilter = (key: keyof RoomFilters, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  );

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && value !== null
  ).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher une salle..."
            value={filters.search || ''}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-10"
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          />
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="w-4 h-4 mr-2" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 px-1.5 py-0.5 text-xs min-w-[1.25rem] h-5"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Filtres de recherche</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="city">Ville</Label>
                <Input
                  id="city"
                  placeholder="Entrez une ville"
                  value={filters.city || ''}
                  onChange={(e) => updateFilter('city', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPrice">Prix min (€/h)</Label>
                  <Input
                    id="minPrice"
                    type="number"
                    placeholder="0"
                    value={filters.minPrice || ''}
                    onChange={(e) => updateFilter('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPrice">Prix max (€/h)</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    placeholder="1000"
                    value={filters.maxPrice || ''}
                    onChange={(e) => updateFilter('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minCapacity">Capacité minimum</Label>
                <Input
                  id="minCapacity"
                  type="number"
                  placeholder="1"
                  value={filters.minCapacity || ''}
                  onChange={(e) => updateFilter('minCapacity', e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={onSearch} className="flex-1" disabled={isLoading}>
                  {isLoading ? 'Recherche...' : 'Rechercher'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {hasActiveFilters && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Filtres actifs
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 px-2"
              >
                <X className="w-3 h-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex flex-wrap gap-2">
              {filters.search && (
                <Badge variant="secondary">
                  Recherche: "{filters.search}"
                </Badge>
              )}
              {filters.city && (
                <Badge variant="secondary">
                  Ville: {filters.city}
                </Badge>
              )}
              {filters.minPrice && (
                <Badge variant="secondary">
                  Prix min: {filters.minPrice}€/h
                </Badge>
              )}
              {filters.maxPrice && (
                <Badge variant="secondary">
                  Prix max: {filters.maxPrice}€/h
                </Badge>
              )}
              {filters.minCapacity && (
                <Badge variant="secondary">
                  Capacité: {filters.minCapacity}+ pers.
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}